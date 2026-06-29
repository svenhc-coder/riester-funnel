"""
Versicherungsfuchs Riester-Check – Backend API
FastAPI · PyPDF2 · Claude Vision · PostgreSQL · Stripe · n8n-ready
"""

from __future__ import annotations
import base64, hashlib, json, re, uuid, os, imghdr
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()  # Lädt .env aus APP_DIR

# pip install fastapi uvicorn PyPDF2 asyncpg stripe python-multipart python-dotenv httpx
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks, Request, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import hmac, time
from collections import defaultdict, deque
from pydantic import BaseModel, EmailStr
import asyncpg
import stripe

# ─── CONFIG (alle Werte aus .env) ─────────────────────────────────────────────

DATABASE_URL        = os.getenv("DATABASE_URL", "postgresql://riester:pass@localhost/riester")
STRIPE_SECRET       = os.getenv("STRIPE_SECRET", "")
STRIPE_WEBHOOK_SEC  = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")
STRIPE_PRICE_KI     = int(os.getenv("STRIPE_PRICE_KI",     "1290"))   # €12,90 KI-Check
STRIPE_PRICE_DEEP   = int(os.getenv("STRIPE_PRICE_DEEP",   "4900"))   # €49,00 Deep-Check
ANTHROPIC_API_KEY   = os.getenv("ANTHROPIC_API_KEY", "sk-ant-...")
N8N_WEBHOOK         = os.getenv("N8N_WEBHOOK", "")
UPLOAD_DIR          = Path(os.getenv("UPLOAD_DIR", "/opt/riester-check/uploads"))
ADMIN_SECRET        = os.getenv("ADMIN_SECRET", "")   # Geheimtoken für Admin-Endpunkte
PIPEDRIVE_TOKEN     = os.getenv("PIPEDRIVE_TOKEN", "")
APP_VERSION         = "1.3.0"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Erlaubte Dateitypen für Upload
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg", "image/jpg", "image/png",
    "image/heic", "image/heif", "image/webp",
}

# CORS: aus .env, Fallback auf Produktion
_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "https://versicherungs-fuchs.online,https://www.versicherungs-fuchs.online"
)
ALLOWED_ORIGINS = [o.strip() for o in _origins_raw.split(",") if o.strip()]

if STRIPE_SECRET:
    stripe.api_key = STRIPE_SECRET

# ─── APP ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Riester-Check API", version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Admin-Token", "Authorization"],
)

# ─── SECURITY (2026-06-11) ─────────────────────────────────────────────────────

def require_admin(x_admin_token: Optional[str] = Header(default=None),
                  authorization: Optional[str] = Header(default=None)) -> bool:
    """Admin-Auth für Berater-/Verwaltungs-Endpunkte. Token via 'X-Admin-Token'
    oder 'Authorization: Bearer <token>'. Timing-safe gegen ADMIN_SECRET."""
    token = (x_admin_token or "").strip()
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not ADMIN_SECRET or not token or not hmac.compare_digest(token, ADMIN_SECRET):
        raise HTTPException(403, "Admin-Auth erforderlich.")
    return True

# Schlanker In-Memory-Rate-Limiter (Single-Process-uvicorn → wirksam).
_rl_buckets: dict[str, deque] = defaultdict(deque)
def rate_limit(request: Request, key: str, max_calls: int, window_s: int) -> None:
    ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip()
          or (request.client.host if request.client else "unknown"))
    now = time.time()
    bucket = _rl_buckets[f"{key}:{ip}"]
    while bucket and bucket[0] < now - window_s:
        bucket.popleft()
    if len(bucket) >= max_calls:
        raise HTTPException(429, "Zu viele Anfragen. Bitte kurz warten.")
    bucket.append(now)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return resp

# ─── MODELS ───────────────────────────────────────────────────────────────────

class LeadIn(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    answers: dict
    ampel_status: str          # green | yellow | red
    source: str = "schnell_check"
    tier: str = "ki"           # ki | deep

class LeadOut(BaseModel):
    lead_id: str
    ampel_status: str
    client_secret: Optional[str] = None   # Stripe PaymentIntent

class UploadOut(BaseModel):
    id: str
    status: str
    file_type: str             # pdf | image
    is_scanned_guess: bool
    snippets_count: int
    text_extracted_chars: int

class ApproveIn(BaseModel):
    case_id: str
    edited_extract: Optional[dict] = None
    edited_recommendation: Optional[dict] = None

# ─── PDF PARSER ───────────────────────────────────────────────────────────────

KEYWORDS = [
    "versicherungsnummer","vertragsnummer","policen","police","beginn","vertragsbeginn",
    "beitrag","monatsbeitrag","jahresbeitrag","garantie","rentenbeginn","zulage",
    "kinderzulage","fonds","etf","auszahl","rentenfaktor","überschuss","kostenquote"
]

def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def extract_text_pages(pdf_path: Path, max_pages: int = 12) -> list[dict]:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(str(pdf_path))
        pages = []
        for i, page in enumerate(reader.pages[:max_pages]):
            try:
                txt = page.extract_text() or ""
            except Exception:
                txt = ""
            txt = " ".join(txt.split())
            pages.append({"page": i + 1, "text": txt})
        return pages
    except Exception:
        return []

def is_scanned_guess(pages: list[dict]) -> tuple[bool, int, float]:
    full = " ".join(p["text"] for p in pages)
    chars = len(full)
    uniq = len(set(full)) / max(1, chars)
    return (chars < 800 or uniq < 0.15), chars, round(uniq, 3)

def build_snippets(pages: list[dict], max_snippets: int = 16, window: int = 300) -> list[dict]:
    snippets = []
    seen = set()
    for p in pages:
        t = p["text"].lower()
        hits = []
        for kw in KEYWORDS:
            idx = t.find(kw)
            if idx != -1:
                hits.append(idx)
        hits = sorted(set(hits))[:6]
        for idx in hits:
            start = max(0, idx - window)
            end = min(len(p["text"]), idx + window)
            snippet = p["text"][start:end].strip()
            if len(snippet) > 60:
                h = hashlib.md5(snippet.encode()).hexdigest()
                if h not in seen:
                    seen.add(h)
                    snippets.append({"page": p["page"], "text": snippet})
        if len(snippets) >= max_snippets:
            break
    return snippets[:max_snippets]

def detect_file_type(filename: str, content: bytes) -> str:
    """Gibt 'pdf' oder 'image' zurück."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return "pdf"
    if ext in {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}:
        return "image"
    # Fallback: Magic-Bytes
    if content[:4] == b"%PDF":
        return "pdf"
    return "image"

def get_image_media_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    mapping = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
        ".heic": "image/jpeg", ".heif": "image/jpeg",  # Anthropic akzeptiert HEIC als JPEG
    }
    return mapping.get(ext, "image/jpeg")

# ─── LLM PROMPTS ──────────────────────────────────────────────────────────────

def build_light_prompt(snippets: list[dict]) -> dict:
    """Token-minimaler Prompt für JSON-Extraktion aus PDF-Text."""
    snippet_text = "\n".join(
        f'{i+1}. (page={s["page"]}, text="{s["text"][:600]}")'
        for i, s in enumerate(snippets)
    )
    return {
        "system": (
            "Du extrahierst strukturierte Vertragsdaten aus Text-Snippets. "
            "Antworte NUR mit gültigem JSON. Keine Erklärungen. Keine Prosa."
        ),
        "user": f"""Schema (null wenn unsicher, evidence.quote muss wörtlich aus Snippets stammen):
{{
  "anbieter": null,
  "produkt": null,
  "vertragsnummer": null,
  "vertragsbeginn": null,
  "beitrag_monat": null,
  "beitrag_jahr": null,
  "garantie_hinweis": null,
  "rentenbeginn": null,
  "zulagen_hinweis": null,
  "fonds_hinweis": null,
  "evidence": [{{"field": "...", "page": null, "quote": null}}]
}}

Snippets:
{snippet_text}"""
    }

def build_vision_prompt() -> dict:
    """Prompt für Bild-basierte Extraktion (Foto/Scan) via Claude Vision."""
    return {
        "system": (
            "Du extrahierst strukturierte Daten aus einem Foto oder Scan eines Versicherungsdokuments. "
            "Antworte NUR mit gültigem JSON. Keine Erklärungen. Keine Prosa."
        ),
        "user": """Analysiere dieses Dokument und extrahiere folgendes JSON:
{
  "anbieter": null,
  "produkt": null,
  "vertragsnummer": null,
  "vertragsbeginn": null,
  "beitrag_monat": null,
  "beitrag_jahr": null,
  "garantie_hinweis": null,
  "rentenbeginn": null,
  "zulagen_hinweis": null,
  "fonds_hinweis": null,
  "evidence": [{"field": "...", "page": "Bild", "quote": null}]
}

Setze Felder auf null wenn du sie nicht erkennst. Nur JSON, keine Erklärungen."""
    }

def build_heavy_prompt(quickcheck: dict, extract_json: dict) -> dict:
    """Kurzempfehlung – max 12 Zeilen Output."""
    return {
        "system": (
            "Du schreibst eine kurze, neutrale Vorprüfung eines Riester-Vertrags. "
            "Keine Verkaufsfloskeln. Keine Kündigungsempfehlung. Max 12 Zeilen gesamt."
        ),
        "user": f"""Input:
quickcheck: {json.dumps(quickcheck, ensure_ascii=False)}
extract_json: {json.dumps(extract_json, ensure_ascii=False)}

Erzeuge JSON:
{{
  "ampel": "green|yellow|red",
  "kurzbegruendung": ["...", "...", "..."],
  "naechste_schritte": ["...", "..."],
  "cta": "Termin buchen | PDF nachreichen | App nutzen"
}}

Regeln:
- Keine rechtliche Beratung
- Keine Kündigungsaufforderung
- Kurz, konkret, faktenbasiert
- JSON only"""
    }

# ─── AMPEL-LOGIK (regelbasiert, tokenlos) ─────────────────────────────────────

def berechne_ampel(answers: dict) -> str:
    gruen = rot = gelb = 0

    vb = answers.get("vertragsbeginn","")
    if vb in ("vor2005","2005_2010"): gruen += 2
    elif vb == "2010_2015": gelb += 1
    elif vb == "nach2015": rot += 2

    b = answers.get("beitrag","")
    if b == "0_25": rot += 2
    elif b == "25_100": gelb += 1
    elif b in ("100_200","200plus"): gruen += 1

    k = answers.get("kinder","")
    if k == "2plus": gruen += 2
    elif k == "1": gruen += 1

    if answers.get("beschaeftigung","") in ("angestellt","beamter"): gruen += 1
    elif answers.get("beschaeftigung","") == "selbststaendig": rot += 1

    if answers.get("beitrag_konstant") == "ja": gruen += 1
    else: rot += 1

    if answers.get("zulagen") == "ja": gruen += 2
    else: rot += 2

    if answers.get("garantiewunsch") == "wichtig": gruen += 1
    elif answers.get("garantiewunsch") == "egal":
        gelb += 1 if vb not in ("nach2015",) else 0
        rot += 1 if vb == "nach2015" else 0

    if answers.get("zusatzbausteine") in ("bu","hinterbliebenen"): gruen += 1
    if answers.get("vertrag_status") == "ruhend": rot += 1

    z = answers.get("ziel","")
    if z == "rendite" and answers.get("garantiewunsch") == "wichtig": rot += 1
    elif z == "foerderung" and answers.get("zulagen") == "ja": gruen += 1

    if gruen >= rot + 3: return "green"
    if rot >= gruen + 2: return "red"
    return "yellow"

# ─── DB HELPERS ───────────────────────────────────────────────────────────────

async def get_db():
    return await asyncpg.connect(DATABASE_URL)

async def cache_check(db, file_sha256: str) -> Optional[dict]:
    """SHA256-Cache: identisches Dokument → keine LLM-Calls."""
    row = await db.fetchrow(
        "SELECT id, snippets_json, extract_json, recommendation_json, status "
        "FROM riester_deepcheck WHERE file_sha256=$1 AND extract_json IS NOT NULL "
        "ORDER BY created_at DESC LIMIT 1",
        file_sha256
    )
    return dict(row) if row else None

async def log_event(db, lead_id: str, event_type: str, payload: dict):
    await db.execute(
        "INSERT INTO system_events(id,lead_id,event_type,payload,created_at) VALUES($1,$2,$3,$4,$5)",
        str(uuid.uuid4()), lead_id, event_type, json.dumps(payload), datetime.now(timezone.utc)
    )

def _safe_delete(path: Path):
    """Löscht Datei sicher und still (DSGVO-Compliance)."""
    try:
        if path.exists():
            path.unlink()
    except Exception:
        pass

# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": APP_VERSION}

@app.post("/api/lead", response_model=LeadOut)
async def create_lead(data: LeadIn, background_tasks: BackgroundTasks, request: Request):
    """Lead speichern + Stripe PaymentIntent erstellen."""
    rate_limit(request, "lead", max_calls=15, window_s=600)
    lead_id = str(uuid.uuid4())
    ampel = berechne_ampel(data.answers)

    # Preis je nach Tier
    price = STRIPE_PRICE_KI if data.tier == "ki" else STRIPE_PRICE_DEEP

    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO riester_leads(id,name,email,answers_json,ampel_status,source,created_at)
               VALUES($1,$2,$3,$4,$5,$6,$7)""",
            lead_id, data.name, data.email,
            json.dumps(data.answers), ampel, data.source,
            datetime.now(timezone.utc)
        )

        # Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=price,
            currency="eur",
            metadata={"lead_id": lead_id, "email": data.email, "tier": data.tier},
            receipt_email=data.email,
        )

        background_tasks.add_task(push_to_crm, lead_id, data, ampel)
        await log_event(db, lead_id, "lead_created", {"ampel": ampel, "tier": data.tier, "price": price})
        return LeadOut(lead_id=lead_id, ampel_status=ampel, client_secret=intent.client_secret)

    finally:
        await db.close()

@app.post("/api/riester/upload", response_model=UploadOut)
async def upload_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    lead_id: str = Form(...),
    payment_id: str = Form(...),
    answers_json: Optional[str] = Form(None),
):
    """PDF oder Foto hochladen, analysieren, LLM-Pipeline starten.
    DSGVO: Datei wird nach Verarbeitung automatisch gelöscht.
    """
    rate_limit(request, "upload", max_calls=10, window_s=600)

    # Bezahl-Verifikation: NIEMALS allein dem Frontend (?payment=success) trauen.
    # Serverseitig prüfen, dass der PaymentIntent wirklich 'succeeded' ist.
    if STRIPE_SECRET:
        try:
            pi = stripe.PaymentIntent.retrieve(payment_id)
        except Exception:
            raise HTTPException(402, "Zahlung nicht auffindbar.")
        if getattr(pi, "status", None) != "succeeded":
            raise HTTPException(402, "Zahlung nicht abgeschlossen.")
    # (ohne STRIPE_SECRET = Dev/Test → kein Live-Geld, Verifikation entfällt)

    # Validierung Dateityp
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Dateityp nicht erlaubt. Erlaubt: PDF, JPG, PNG, HEIC, WEBP")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(400, "Datei zu groß (max. 15 MB).")

    file_type = detect_file_type(file.filename, content)
    sha = sha256_bytes(content)
    case_id = str(uuid.uuid4())

    # Speichern (temporär – wird nach Verarbeitung gelöscht)
    save_ext = ext if ext in ALLOWED_EXTENSIONS else ".bin"
    file_path = UPLOAD_DIR / f"{case_id}{save_ext}"
    file_path.write_bytes(content)

    # Quickcheck-Antworten parsen (optional)
    answers = {}
    if answers_json:
        try:
            answers = json.loads(answers_json)
        except Exception:
            pass

    db = await get_db()
    try:
        cached = await cache_check(db, sha)

        if file_type == "pdf":
            pages = extract_text_pages(file_path)
            scanned, chars, uniq = is_scanned_guess(pages)
            snippets = build_snippets(pages) if not scanned else []
            status = "needs_ocr" if scanned else "extracted"
        else:
            # Bild: wird direkt per Vision verarbeitet
            pages = []
            scanned = False
            chars = len(content)
            snippets = []
            status = "image_uploaded"

        await db.execute(
            """INSERT INTO riester_deepcheck(
                id, lead_id, file_sha256, file_url, file_type,
                text_extracted_chars, is_scanned_guess, snippets_json,
                status, payment_id, created_at
               ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
            case_id, lead_id, sha, str(file_path), file_type,
            chars, scanned, json.dumps(snippets),
            status, payment_id, datetime.now(timezone.utc)
        )

        await log_event(db, lead_id, "file_uploaded", {
            "case_id": case_id, "file_type": file_type,
            "chars": chars, "scanned": scanned, "snippets": len(snippets)
        })

        if cached:
            await db.execute(
                "UPDATE riester_deepcheck SET extract_json=$1, status='needs_human_review' WHERE id=$2",
                json.dumps(cached["extract_json"]), case_id
            )
            # DSGVO: Datei sofort löschen bei Cache-Hit
            background_tasks.add_task(_safe_delete, file_path)

        elif file_type == "image":
            # Vision-Pipeline: Bild → Claude Vision → Extraktion
            background_tasks.add_task(
                run_vision_pipeline, case_id, file_path, content, file.filename, lead_id, answers
            )

        elif file_type == "pdf" and not scanned and snippets:
            # Text-Pipeline: Snippets → Claude Haiku → Extraktion
            background_tasks.add_task(
                run_llm_pipeline, case_id, snippets, lead_id, answers
            )
        else:
            # Gescannt: OCR nötig, Datei bleibt bis zur manuellen Verarbeitung
            pass

        return UploadOut(
            id=case_id,
            status=status,
            file_type=file_type,
            is_scanned_guess=scanned,
            snippets_count=len(snippets),
            text_extracted_chars=chars,
        )
    finally:
        await db.close()

@app.post("/api/riester/extract")
async def manual_extract(case_id: str, _admin: bool = Depends(require_admin)):
    """Snippet-Extraktion manuell anstoßen (z.B. nach OCR). Admin-only."""
    db = await get_db()
    try:
        row = await db.fetchrow("SELECT * FROM riester_deepcheck WHERE id=$1", case_id)
        if not row:
            raise HTTPException(404, "Case nicht gefunden.")
        pages = extract_text_pages(Path(row["file_url"]))
        snippets = build_snippets(pages)
        await db.execute(
            "UPDATE riester_deepcheck SET snippets_json=$1, status='parsed' WHERE id=$2",
            json.dumps(snippets), case_id
        )
        return {"snippets_count": len(snippets)}
    finally:
        await db.close()

@app.post("/api/riester/approve")
async def approve_case(data: ApproveIn, background_tasks: BackgroundTasks, _admin: bool = Depends(require_admin)):
    """Berater genehmigt Fall → Bericht senden. Admin-only."""
    db = await get_db()
    try:
        if data.edited_extract:
            await db.execute(
                "UPDATE riester_deepcheck SET extract_json=$1 WHERE id=$2",
                json.dumps(data.edited_extract), data.case_id
            )
        if data.edited_recommendation:
            await db.execute(
                "UPDATE riester_deepcheck SET recommendation_json=$1 WHERE id=$2",
                json.dumps(data.edited_recommendation), data.case_id
            )
        await db.execute(
            "UPDATE riester_deepcheck SET status='approved', updated_at=$1 WHERE id=$2",
            datetime.now(timezone.utc), data.case_id
        )
        await log_event(db, data.case_id, "case_approved", {})
        background_tasks.add_task(send_report, data.case_id)
        return {"status": "approved"}
    finally:
        await db.close()

@app.post("/api/riester/reject")
async def reject_case(case_id: str, _admin: bool = Depends(require_admin)):
    db = await get_db()
    try:
        await db.execute(
            "UPDATE riester_deepcheck SET status='rejected', updated_at=$1 WHERE id=$2",
            datetime.now(timezone.utc), case_id
        )
        await log_event(db, case_id, "case_rejected", {})
        return {"status": "rejected"}
    finally:
        await db.close()

@app.get("/api/riester/case/{case_id}")
async def get_case(case_id: str, _admin: bool = Depends(require_admin)):
    db = await get_db()
    try:
        row = await db.fetchrow("SELECT * FROM riester_deepcheck WHERE id=$1", case_id)
        if not row:
            raise HTTPException(404)
        return dict(row)
    finally:
        await db.close()

@app.get("/api/riester/cases")
async def list_cases(status: Optional[str] = None, limit: int = 50, _admin: bool = Depends(require_admin)):
    db = await get_db()
    try:
        if status:
            rows = await db.fetch(
                "SELECT * FROM riester_deepcheck WHERE status=$1 ORDER BY created_at DESC LIMIT $2",
                status, limit
            )
        else:
            rows = await db.fetch(
                "SELECT * FROM riester_deepcheck ORDER BY created_at DESC LIMIT $1", limit
            )
        return [dict(r) for r in rows]
    finally:
        await db.close()

# ─── ADMIN: Halbautomatische Erstattung ───────────────────────────────────────

async def _do_refund(email: str, payment_id: Optional[str] = None):
    """Führt die echte Stripe-Erstattung aus. NUR aus dem POST-Handler aufrufen (Auth liegt dort)."""
    db = await get_db()
    try:
        # Lead per E-Mail finden
        lead = await db.fetchrow(
            "SELECT * FROM riester_leads WHERE email=$1 ORDER BY created_at DESC LIMIT 1",
            email
        )
        if not lead:
            raise HTTPException(404, f"Kein Lead mit E-Mail {email} gefunden.")

        lead_id = str(lead["id"])

        # Payment ID aus DB holen wenn nicht übergeben
        if not payment_id:
            case = await db.fetchrow(
                "SELECT payment_id FROM riester_deepcheck WHERE lead_id=$1 AND payment_id IS NOT NULL "
                "ORDER BY created_at DESC LIMIT 1",
                lead_id
            )
            if not case:
                raise HTTPException(404, "Kein Payment für diesen Lead gefunden.")
            payment_id = case["payment_id"]

        # Stripe Refund auslösen
        try:
            refund = stripe.Refund.create(
                payment_intent=payment_id,
                reason="requested_by_customer",
                metadata={"email": email, "confirmed_by": "admin", "ts": datetime.now(timezone.utc).isoformat()},
            )
        except stripe.error.InvalidRequestError as e:
            if "already been refunded" in str(e).lower():
                return JSONResponse({"status": "already_refunded", "email": email, "payment_id": payment_id})
            raise HTTPException(400, f"Stripe Fehler: {str(e)}")
        except stripe.error.StripeError as e:
            raise HTTPException(400, f"Stripe Fehler: {str(e)}")

        # DB updaten
        await db.execute(
            "UPDATE riester_deepcheck SET refunded_at=$1, status='refunded' WHERE lead_id=$2 AND payment_id=$3",
            datetime.now(timezone.utc), lead_id, payment_id
        )
        await db.execute(
            "UPDATE riester_leads SET is_client=true WHERE id=$1",
            lead_id
        )
        await log_event(db, lead_id, "refund_issued", {
            "refund_id": refund["id"],
            "payment_id": payment_id,
            "email": email,
            "confirmed_by": "admin_link",
        })

        # n8n Event (optional: Pipedrive Update, Slack-Notification)
        await push_n8n_event("client_confirmed_refund", {
            "lead_id": lead_id,
            "email": email,
            "payment_id": payment_id,
            "refund_id": refund["id"],
        })

        # Schöne HTML-Antwort für direkten Link-Klick
        return JSONResponse({
            "status": "refunded",
            "email": email,
            "refund_id": refund["id"],
            "payment_id": payment_id,
            "message": f"Erstattung für {email} erfolgreich ausgelöst. Refund-ID: {refund['id']}"
        })

    finally:
        await db.close()


@app.get("/api/admin/confirm-client", response_class=HTMLResponse)
async def confirm_client_page(
    email: str = Query(...),
    token: str = Query(...),
    payment_id: Optional[str] = Query(None),
):
    """Zeigt NUR eine Bestätigungsseite — löst KEINEN Refund aus (Prefetch/Crawler-sicher).
    Die echte Erstattung läuft erst über den POST-Button unten."""
    if not ADMIN_SECRET or not hmac.compare_digest(token, ADMIN_SECRET):
        raise HTTPException(403, "Ungültiger Token.")
    import html as _html
    e = _html.escape(email); pid = _html.escape(payment_id or ""); tok = _html.escape(token)
    return HTMLResponse(
        "<!doctype html><html lang=de><meta charset=utf-8>"
        "<meta name=viewport content='width=device-width,initial-scale=1'>"
        "<title>Erstattung bestätigen</title>"
        "<body style='font-family:system-ui;max-width:480px;margin:60px auto;padding:0 20px'>"
        "<h2>Erstattung bestätigen</h2>"
        f"<p>Kunde: <b>{e}</b><br>Payment: <code>{pid or 'aus DB'}</code></p>"
        "<form method=post action='/api/admin/confirm-client'>"
        f"<input type=hidden name=email value='{e}'>"
        f"<input type=hidden name=token value='{tok}'>"
        f"<input type=hidden name=payment_id value='{pid}'>"
        "<button style='background:#c0392b;color:#fff;border:0;padding:12px 20px;border-radius:8px;font-size:16px;cursor:pointer'>"
        "Stripe-Erstattung jetzt auslösen</button></form>"
        "<p style='color:#888;font-size:13px'>Dieser Schritt löst eine echte Rückzahlung aus.</p>"
        "</body></html>"
    )


@app.post("/api/admin/confirm-client")
async def confirm_client_post(
    email: str = Form(...),
    token: str = Form(...),
    payment_id: Optional[str] = Form(None),
):
    """Führt die Erstattung aus — state-changing, daher POST + Token-Check."""
    if not ADMIN_SECRET or not hmac.compare_digest(token, ADMIN_SECRET):
        raise HTTPException(403, "Ungültiger Token.")
    return await _do_refund(email, payment_id or None)

# Stripe Webhook
@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    """Stripe Webhook → Payment-Bestätigung."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SEC)
    except Exception:
        raise HTTPException(400, "Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        db = await get_db()
        try:
            await db.execute(
                "UPDATE riester_deepcheck SET status='payment_confirmed' "
                "WHERE payment_id=$1 AND status IN ('uploaded','image_uploaded')",
                pi["id"]
            )
            await db.close()
        except Exception:
            await db.close()

    return {"received": True}

@app.post("/api/stripe/refund")
async def trigger_refund(payment_id: str, case_id: str, token: str = ""):
    """Erstattung auslösen – erfordert Admin-Token."""
    if not ADMIN_SECRET or token != ADMIN_SECRET:
        raise HTTPException(403, "Admin-Token erforderlich.")
    try:
        refund = stripe.Refund.create(payment_intent=payment_id, reason="requested_by_customer")
        db = await get_db()
        await db.execute(
            "UPDATE riester_deepcheck SET refunded_at=$1, status='refunded' WHERE id=$2",
            datetime.now(timezone.utc), case_id
        )
        await log_event(db, case_id, "refund_issued", {"refund_id": refund["id"], "payment_id": payment_id})
        await db.close()
        await push_n8n_event("refund_issued", {
            "case_id": case_id, "payment_id": payment_id, "refund_id": refund["id"]
        })
        return {"status": "refunded", "refund_id": refund["id"]}
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))

# ─── BACKGROUND TASKS ─────────────────────────────────────────────────────────

async def run_llm_pipeline(case_id: str, snippets: list[dict], lead_id: str, answers: dict = {}):
    """LLM Text-Pipeline: Snippets → Haiku → JSON Extraktion.
    DSGVO: PDF wird nach Extraktion automatisch gelöscht.
    """
    import httpx

    prompt = build_light_prompt(snippets)
    extract = {}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 800,
                    "system": prompt["system"],
                    "messages": [{"role": "user", "content": prompt["user"]}],
                },
                timeout=30,
            )
        raw = resp.json()["content"][0]["text"]
        extract = json.loads(raw)
    except Exception as e:
        extract = {"error": str(e)}

    db = await get_db()
    try:
        await db.execute(
            "UPDATE riester_deepcheck SET extract_json=$1, status='needs_human_review', "
            "updated_at=$2 WHERE id=$3",
            json.dumps(extract), datetime.now(timezone.utc), case_id
        )
        await log_event(db, lead_id, "llm_text_done", {"extract_keys": list(extract.keys())})

        # DSGVO: Datei löschen nach Extraktion
        row = await db.fetchrow("SELECT file_url FROM riester_deepcheck WHERE id=$1", case_id)
        if row and row["file_url"]:
            _safe_delete(Path(row["file_url"]))
            await db.execute(
                "UPDATE riester_deepcheck SET file_url='[deleted]', deleted_at=$1 WHERE id=$2",
                datetime.now(timezone.utc), case_id
            )

    finally:
        await db.close()

    await push_n8n_event("review_ready", {"case_id": case_id, "lead_id": lead_id, "type": "text"})

async def run_vision_pipeline(
    case_id: str,
    file_path: Path,
    content: bytes,
    filename: str,
    lead_id: str,
    answers: dict = {},
):
    """Vision-Pipeline: Foto/Scan → Claude Vision → JSON Extraktion.
    DSGVO: Bild wird nach Extraktion automatisch gelöscht.
    """
    import httpx

    media_type = get_image_media_type(filename)
    image_b64 = base64.b64encode(content).decode()
    prompt = build_vision_prompt()
    extract = {}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 800,
                    "system": prompt["system"],
                    "messages": [{
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_b64,
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt["user"],
                            }
                        ]
                    }],
                },
                timeout=45,
            )
        raw = resp.json()["content"][0]["text"]
        extract = json.loads(raw)
    except Exception as e:
        extract = {"error": str(e)}

    db = await get_db()
    try:
        await db.execute(
            "UPDATE riester_deepcheck SET extract_json=$1, status='needs_human_review', "
            "updated_at=$2 WHERE id=$3",
            json.dumps(extract), datetime.now(timezone.utc), case_id
        )
        await log_event(db, lead_id, "llm_vision_done", {"extract_keys": list(extract.keys())})

        # DSGVO: Bild sofort nach Extraktion löschen
        _safe_delete(file_path)
        await db.execute(
            "UPDATE riester_deepcheck SET file_url='[deleted]', deleted_at=$1 WHERE id=$2",
            datetime.now(timezone.utc), case_id
        )

    finally:
        await db.close()

    await push_n8n_event("review_ready", {"case_id": case_id, "lead_id": lead_id, "type": "vision"})

async def send_report(case_id: str):
    """Report an Kunden senden (via n8n / Mail)."""
    await push_n8n_event("send_report", {"case_id": case_id})
    db = await get_db()
    await db.execute(
        "UPDATE riester_deepcheck SET status='sent', updated_at=$1 WHERE id=$2",
        datetime.now(timezone.utc), case_id
    )
    await db.close()

async def push_to_crm(lead_id: str, data: LeadIn, ampel: str):
    """Pipedrive: Lead als Deal anlegen."""
    import httpx
    if not PIPEDRIVE_TOKEN:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.pipedrive.com/v1/persons?api_token={PIPEDRIVE_TOKEN}",
            json={"name": data.name or data.email, "email": [{"value": data.email}]}
        )
        await client.post(
            f"https://api.pipedrive.com/v1/deals?api_token={PIPEDRIVE_TOKEN}",
            json={
                "title": f"Riester-Check – {data.email}",
                "stage_id": {"green": 1, "yellow": 2, "red": 3}.get(ampel, 2),
            }
        )

async def push_n8n_event(event_type: str, payload: dict):
    """n8n Webhook aufrufen."""
    import httpx
    if not N8N_WEBHOOK:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{N8N_WEBHOOK}/riester-{event_type}",
                json={"event": event_type, "payload": payload, "ts": datetime.now(timezone.utc).isoformat()},
                timeout=5,
            )
    except Exception:
        pass  # Non-blocking

# ─── DB MIGRATION HINWEIS ─────────────────────────────────────────────────────
# Neue Spalten in riester_deepcheck:
#   ALTER TABLE riester_deepcheck ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';
#   ALTER TABLE riester_deepcheck ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
#   ALTER TABLE riester_deepcheck ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
# Neue Spalte in riester_leads:
#   ALTER TABLE riester_leads ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE;

# ─── START ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)
