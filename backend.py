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
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    allow_methods=["*"],
    allow_headers=["*"],
)

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
async def create_lead(data: LeadIn, background_tasks: BackgroundTasks):
    """Lead speichern + Stripe PaymentIntent erstellen."""
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    lead_id: str = Form(...),
    payment_id: str = Form(...),
    answers_json: Optional[str] = Form(None),
):
    """PDF oder Foto hochladen, analysieren, LLM-Pipeline starten.
    DSGVO: Datei wird nach Verarbeitung automatisch gelöscht.
    """
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
async def manual_extract(case_id: str):
    """Snippet-Extraktion manuell anstoßen (z.B. nach OCR)."""
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
async def approve_case(data: ApproveIn, background_tasks: BackgroundTasks):
    """Berater genehmigt Fall → Bericht senden."""
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
async def reject_case(case_id: str):
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
async def get_case(case_id: str):
    db = await get_db()
    try:
        row = await db.fetchrow("SELECT * FROM riester_deepcheck WHERE id=$1", case_id)
        if not row:
            raise HTTPException(404)
        return dict(row)
    finally:
        await db.close()

@app.get("/api/riester/cases")
async def list_cases(status: Optional[str] = None, limit: int = 50):
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

@app.get("/api/admin/confirm-client")
async def confirm_client_get(
    email: str = Query(..., description="Kunden-E-Mail"),
    token: str = Query(..., description="Admin-Secret-Token"),
    payment_id: Optional[str] = Query(None, description="Stripe PaymentIntent ID (optional, sonst aus DB)"),
):
    """
    Halbautomatische Erstattung per Link-Klick.
    Sven ruft auf: https://api.versicherungs-fuchs.online/api/admin/confirm-client?email=X&token=SECRET
    → Stripe Refund wird ausgelöst wenn: App installiert + Maklervertrag + Dokumente hochgeladen.

    Token kommt aus .env ADMIN_SECRET
    """
    if not ADMIN_SECRET or token != ADMIN_SECRET:
        raise HTTPException(403, "Ungültiger Token.")

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
 