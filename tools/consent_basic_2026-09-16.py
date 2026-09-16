# -*- coding: utf-8 -*-
"""VF: Consent Mode ADVANCED -> BASIC (Sven-Freigabe 16.09.2026 ueber die Koordination, Task bc8361bc).
Vorher: Google-Tag (AW-820163824 + G-VYF5P956SP) lag im <head> jeder Seite und lud VOR der Einwilligung (cookielose
Pings). Jetzt wie alle anderen Marken (messung.py): kein Google-Request vor der Einwilligung — der Loader sitzt in
assets/js/vf-messung.js und laeuft nur, wenn localStorage vf_cookie_consent = 'accepted' (beim Klick sofort, sonst
beim naechsten Seitenaufruf). Der dataLayer-Stub + consent default bleiben im <head> (kein Request).
Idempotent. Aufruf: python tools/consent_basic_2026-09-16.py
"""
import io, os, re
HIER = os.path.dirname(os.path.abspath(__file__)); VF = os.path.dirname(HIER)
V = "20260916b"
GEAENDERT = []


def lese(rel): return io.open(os.path.join(VF, rel), encoding="utf-8").read()


def schreibe(rel, t):
    p = os.path.join(VF, rel)
    io.open(p + ".neu", "w", encoding="utf-8", newline="\r\n").write(t); os.replace(p + ".neu", p); GEAENDERT.append(rel)


MESSUNG_JS = r"""/* VersicherungsFuchs — Messung, Consent BASIC (16.09.2026, Sven-Freigabe; Standard aller Marken, messung.py):
   Google Ads (AW-820163824) + Google Analytics 4 (G-VYF5P956SP) laden NUR nach Einwilligung
   (localStorage vf_cookie_consent = 'accepted'). Ohne Einwilligung faellt kein Request an Google an.
   Der dataLayer-Stub + consent default stehen im <head>; hier: consent update, Loader, EIN page_view
   (GA4-config; AW-config mit send_page_view:false — Memory page-view-doppelt-messung-py).
   Schluesselereignisse (in GA4 als Key Events markieren): check_start, submit_lead_form, purchase. */
(function () {
  var AW = 'AW-820163824', GA = 'G-VYF5P956SP', geladen = false;
  function einwilligung() {
    try { return localStorage.getItem('vf_cookie_consent') === 'accepted'; } catch (e) { return false; }
  }
  function lade() {
    if (geladen || !einwilligung()) return;
    geladen = true;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') { window.gtag = function () { window.dataLayer.push(arguments); }; }
    window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', AW, { send_page_view: false });
    window.gtag('config', GA);
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW;
    document.head.appendChild(s);
  }
  window.vfEvent = function (name, params) {
    if (!einwilligung()) return;
    lade();
    try { window.gtag('event', name, params || {}); } catch (e) {}
  };
  window.addEventListener('vf-consent', lade);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lade); else lade();
})();
"""

# 1. vf-messung.js
if lese("assets/js/vf-messung.js") != MESSUNG_JS:
    schreibe("assets/js/vf-messung.js", MESSUNG_JS)

# 2. Head aller Seiten: Loader + config raus, Kommentar anpassen, Messung-Version hochziehen
KOPF_ALT = ("<script async src=\"https://www.googletagmanager.com/gtag/js?id=AW-820163824\"></script>\n"
            "<script>gtag('js',new Date());gtag('config','AW-820163824');gtag('config','G-VYF5P956SP');</script>\n")
KOMM_ALT = ("<!-- Consent-Mode + Google Ads (Conversion-Messung). Default \"denied\";\n"
            "     assets/js/cookie-notice.js hebt das nach Zustimmung per consent update auf. -->")
KOMM_NEU = ("<!-- Consent BASIC (16.09.2026): Google Ads + GA4 laden erst nach Einwilligung (assets/js/vf-messung.js).\n"
            "     Hier nur dataLayer-Stub + consent default — kein Request an Google. -->")
n = 0
for d, dirs, fs in os.walk(VF):
    dirs[:] = [x for x in dirs if x not in (".git", "tools")]
    for f in fs:
        if not f.endswith(".html"): continue
        rel = os.path.relpath(os.path.join(d, f), VF).replace("\\", "/")
        t = lese(rel); alt = t
        t = t.replace(KOPF_ALT, "")
        t = t.replace(KOMM_ALT, KOMM_NEU)
        t = t.replace('src="/assets/js/vf-messung.js?v=1"', 'src="/assets/js/vf-messung.js?v=%s"' % V)
        if t != alt: schreibe(rel, t); n += 1
print("Seiten:", n)

# 3. cookie-notice.js: Einwilligung als Ereignis melden, Kopfkommentar
rel = "assets/js/cookie-notice.js"; t = lese(rel); alt = t
t = t.replace("   - Eine Stufe: Marketing (Google Ads Conversion-Messung + Google Analytics 4, beide im <head>).",
              "   - Eine Stufe: Marketing (Google Ads Conversion-Messung + Google Analytics 4) — Consent BASIC: die Tags\n"
              "     laedt assets/js/vf-messung.js erst nach Zustimmung (Ereignis 'vf-consent'); vorher kein Google-Request.")
t = t.replace("   Das Google-Tag liegt im <head> jeder Seite mit Consent-Default \"denied\".\n"
              "   Hier wird die Entscheidung des Nutzers per gtag(consent,update) durchgereicht. */",
              "   Im <head> steht nur der dataLayer-Stub mit Consent-Default \"denied\". */")
if "new Event('vf-consent')" not in t:
    t = t.replace("      if (a === 'accept') { writeConsent('accepted');  updateConsent(true);  hide(); }",
                  "      if (a === 'accept') { writeConsent('accepted');  updateConsent(true);  try { window.dispatchEvent(new Event('vf-consent')); } catch (err) {}  hide(); }")
if t != alt: schreibe(rel, t)
for d, dirs, fs in os.walk(VF):
    dirs[:] = [x for x in dirs if x not in (".git", "tools")]
    for f in fs:
        if f.endswith(".html"):
            rel = os.path.relpath(os.path.join(d, f), VF).replace("\\", "/"); t = lese(rel)
            if 'cookie-notice.js?v=20260916"' in t:
                schreibe(rel, t.replace('cookie-notice.js?v=20260916"', 'cookie-notice.js?v=%s"' % V))

# 4. Datenschutz: Abschnitt 3 beschreibt jetzt BASIC
rel = "datenschutz.html"; t = lese(rel); alt = t
t = t.replace("Ohne Ihre Einwilligung bleiben die Google-Tags im Zustand „denied“ (Consent Mode): Es werden keine Werbe- oder "
              "Analyse-Cookies gesetzt; Google erhält lediglich cookielose, nicht personenbezogene Signale zur Modellierung.",
              "Ohne Ihre Einwilligung wird kein Google-Skript geladen — es fließen dann keine Daten an Google.")
if t != alt: schreibe(rel, t)

print("geaendert:", len(GEAENDERT))
