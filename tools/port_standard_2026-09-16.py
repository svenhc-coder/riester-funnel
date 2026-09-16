# -*- coding: utf-8 -*-
"""VersicherungsFuchs — Port der Standard-Runde vom 15./16.09.2026 auf die LIVE-Basis (svenhc-coder/riester-funnel).

Hintergrund: Der lokale Tree „2027" war ein veralteter Fork (Marke-Redesign vom 02.–04.09. nie deployed); die
acht Commits 7076896…e7f7d52 lagen darauf. Dieses Skript setzt dieselben Aenderungen Hunk fuer Hunk auf den
Live-Stand — additiv, nichts Vorhandenes wird entfernt. Idempotent (zweiter Lauf aendert nichts).

Was es tut:
 1. Rechtsseiten: impressum.html (USt-IdNr., Beteiligungen § 15 VersVermV, PKV-Ombudsmann, EU-ODR-Text ersetzt
    durch Verbraucherstreitbeilegung, Links auf Erstinformation/Widerruf/Bildnachweis), datenschutz.html
    (Datenschutzbeauftragter DATENDO XL GmbH, Abschnitt 3 „Cookies und Tracking" ehrlich: Google Ads +
    Google Analytics 4 statt „keine Tracking-Cookies", Widerruf ueber Cookie-Einstellungen), neue Seiten
    widerrufsbelehrung.html, erstinformation.html, bildnachweis.html in der Live-Seitenhuelle (Impressum).
    Texte kommen aus regionalmarken-websites/rechtliches.py (eine Wahrheit fuer alle Marken).
 2. Footer-Links (Erstinformation, Widerruf, Bildnachweis, Cookie-Einstellungen) in allen drei Footer-Varianten.
 3. Messung: assets/js/vf-messung.js = Ereignis-Schicht ueber dem vorhandenen Google-Tag (Consent Mode bleibt wie
    live: Tag im <head>, Default denied, Banner reicht die Entscheidung durch). Schluesselereignisse check_start
    (Fragebogen Frage 0), submit_lead_form (Ergebnis), purchase (Stripe bestaetigt). Banner-Text nennt GA4.
 4. CSP in _headers: Google Analytics, ProvenExpert, Stripe (js.stripe.com wurde bisher gar nicht geladen — der
    Zahlungsdialog rief Stripe() ohne Bibliothek; jetzt wird sie beim Oeffnen des Dialogs nachgeladen).
 5. ProvenExpert-PRO-Siegel (VF-CI, rechts unten ab 900 px, unter dem Kopfbereich) auf Start-, Check- und Wissen-Seiten.
 6. Werbeaussagen ohne Beleg entschaerft (GPT-Review 15.09.), tote Links (favicon.ico), Ueberschriften-Reihenfolge
    auf der Startseite (h4/h5 -> h3 bzw. Footer-Label, gleiche Optik) fuer Lighthouse heading-order.
Aufruf: python tools/port_standard_2026-09-16.py   — Rollback: git checkout -- . && git clean -fd (im 2027-live-Tree)
"""
import io
import os
import re
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
VF = os.path.dirname(HIER)
REGIO = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(VF))), "regionalmarken-websites")
sys.path.insert(0, REGIO)
import rechtliches as R  # noqa: E402

V = "20260916"
B = {"name": "VersicherungsFuchs", "nap": None, "turnstile_sitekey": "", "domain": "versicherungs-fuchs.online"}
GEAENDERT = []


def lese(rel):
    return io.open(os.path.join(VF, rel), encoding="utf-8").read()


def schreibe(rel, text):
    """Erst .neu schreiben, dann os.replace — nie eine halb geschriebene Datei (Memory schreibmodus-leert-vor-dem-fehler).
    Arbeitskopie hat CRLF (core.autocrlf=true); Git normalisiert beim Commit."""
    p = os.path.join(VF, rel)
    io.open(p + ".neu", "w", encoding="utf-8", newline="\r\n").write(text)
    os.replace(p + ".neu", p)
    GEAENDERT.append(rel)


def seiten():
    for d, dirs, fs in os.walk(VF):
        dirs[:] = [x for x in dirs if x not in (".git", "tools", "node_modules")]
        for f in sorted(fs):
            if f.endswith(".html"):
                yield os.path.relpath(os.path.join(d, f), VF).replace("\\", "/")


def ersetze_einmal(t, alt, neu, pflicht=True, wo=""):
    if neu in t:
        return t
    if alt not in t:
        if pflicht:
            raise SystemExit("Anker fehlt (%s): %r" % (wo, alt[:80]))
        return t
    return t.replace(alt, neu, 1)


# ---------------------------------------------------------------------------------------------------- 1. Rechtsseiten
LINK_CSS = '<style id="vf-rechtslinks">.page-wrap p a,.page-wrap li a{text-decoration:underline;text-underline-offset:2px}</style>\n</head>'


def impressum():
    t = lese("impressum.html"); alt = t
    # Lighthouse link-in-text-block: Links im Fliesstext nur per Farbe erkennbar
    if "vf-rechtslinks" not in t: t = t.replace("</head>", LINK_CSS, 1)
    t = ersetze_einmal(t, '<link rel="icon" href="/assets/img/favicon.ico" type="image/x-icon">',
                       '<link rel="icon" href="/assets/img/favicon.png" type="image/png">', False)
    t = ersetze_einmal(t, "<h2>Steuernummer gemäß § 27a Umsatzsteuergesetz</h2>\n  <p>219/5820/2935 — Finanzamt Köln-Süd</p>",
                       "<h2>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz</h2>\n  <p>USt-IdNr.: %s</p>\n"
                       "  <p>Steuernummer: 219/5820/2935 — Finanzamt Köln-Süd</p>" % R.UST_ID, wo="impressum USt")
    if "Beteiligungen (§ 15 VersVermV)" not in t:
        t = ersetze_einmal(t, "\n  <h2>Berufsbezeichnung</h2>",
                           "\n  <h2>Beteiligungen (§ 15 VersVermV)</h2>\n"
                           "  <p>Die iSurance Finanz- und Versicherungsvermittlungs UG hält keine direkte oder indirekte Beteiligung "
                           "von über 10 % an den Stimmrechten oder am Kapital eines Versicherungsunternehmens. Kein Versicherungs"
                           "unternehmen hält eine direkte oder indirekte Beteiligung von über 10 % an den Stimmrechten oder am "
                           "Kapital der iSurance Finanz- und Versicherungsvermittlungs UG.</p>\n"
                           "\n  <h2>Berufsbezeichnung</h2>", wo="impressum Beteiligungen")
    if "pkv-ombudsmann.de" not in t:
        t = ersetze_einmal(t, "\n  <h2>Vermögensschadenhaftpflicht</h2>",
                           "\n  <p><strong>Ombudsmann Private Kranken- und Pflegeversicherung</strong><br>\n"
                           "     Postfach 06 02 22, 10052 Berlin · <a href=\"https://www.pkv-ombudsmann.de\" target=\"_blank\" "
                           "rel=\"noopener\">www.pkv-ombudsmann.de</a></p>\n"
                           "\n  <h2>Vermögensschadenhaftpflicht</h2>", wo="impressum PKV-Ombudsmann")
    t = ersetze_einmal(t, "<h2>Hinweis auf EU-Streitschlichtung</h2>\n  <p>Plattform der EU-Kommission zur Online-Streitbeilegung:\n"
                       "     <a href=\"https://ec.europa.eu/consumers/odr\" target=\"_blank\">ec.europa.eu/consumers/odr</a>.\n"
                       "     Unsere E-Mail-Adresse finden Sie oben.</p>",
                       "<h2>Verbraucherstreitbeilegung</h2>\n  <p>Die Plattform der EU zur Online-Streitbeilegung (OS-Plattform) wurde zum "
                       "20. Juli 2025 eingestellt. Zur außergerichtlichen Beilegung von Streitigkeiten aus der Versicherungsvermittlung "
                       "sind die oben genannten Schlichtungsstellen (Versicherungsombudsmann e.V., PKV-Ombudsmann) zuständig; die "
                       "Teilnahme ist für uns als Versicherungsmakler verpflichtend (§ 214 VVG).</p>\n"
                       "\n  <h2>Erstinformation, Widerruf und Bildnachweis</h2>\n  <p>Die gesetzliche <a href=\"/erstinformation.html\">"
                       "Erstinformation nach § 15 VersVermV</a> und die <a href=\"/widerrufsbelehrung.html\">Widerrufsbelehrung für "
                       "Verbraucher</a> finden Sie auf eigenen Seiten. Herkunft und Rechte der Bilder: <a href=\"/bildnachweis.html\">"
                       "Bildnachweis</a>.</p>", wo="impressum ODR")
    if t != alt:
        schreibe("impressum.html", t)


DSB = ("\n  <h2>Datenschutzbeauftragter</h2>\n  <p>Wir haben einen externen Datenschutzbeauftragten benannt:</p>\n"
       "  <p>DATENDO XL GmbH<br>Frankfurter Allee 108<br>10247 Berlin<br>Telefon: <a href=\"tel:+4915168556143\">0151 68556143</a><br>"
       "E-Mail: <a href=\"mailto:pl@datendo.de\">pl@datendo.de</a><br><a href=\"https://www.datendo.de\" target=\"_blank\" "
       "rel=\"noopener\">www.datendo.de</a></p>\n"
       "  <p>Sie erreichen unseren Datenschutzbeauftragten direkt unter dieser Adresse oder über "
       "<a href=\"mailto:datenschutz@isurance-group.de\">datenschutz@isurance-group.de</a>.</p>\n")

COOKIES_ALT = ("<p>Diese Website verwendet ausschließlich technisch notwendige Cookies sowie Session-Storage für die Funktionalität "
               "des Riester-Checks (Speicherung Ihrer Antworten während der Nutzung). Tracking-Cookies oder Werbe-Cookies werden nicht eingesetzt.</p>")
COOKIES_NEU = (
    "<p>Diese Website verwendet technisch notwendige Cookies sowie Session-Storage für die Funktionalität des Riester-Checks "
    "(Speicherung Ihrer Antworten während der Nutzung). Ihre Entscheidung im Cookie-Hinweis speichern wir im Browser "
    "(Schlüssel <code>vf_cookie_consent</code>, 12 Monate). Nur wenn Sie „Alle akzeptieren“ wählen, setzen wir zusätzlich die "
    "beiden folgenden Google-Dienste mit Cookies ein (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Ohne Ihre Einwilligung "
    "bleiben die Google-Tags im Zustand „denied“ (Consent Mode): Es werden keine Werbe- oder Analyse-Cookies gesetzt; Google "
    "erhält lediglich cookielose, nicht personenbezogene Signale zur Modellierung.</p>\n"
    "\n  <h3>3.1 Google Ads Conversion-Messung</h3>\n"
    "  <p>Wir messen, ob ein Besuch über eine Google-Anzeige zu einer Anfrage geführt hat (Google Ireland Limited, Gordon House, "
    "Barrow Street, Dublin 4, Irland). Dazu setzt Google nach Einwilligung ein Conversion-Cookie (Laufzeit bis 90 Tage). "
    "Wir erhalten nur aggregierte Zahlen, keine Identifizierung einzelner Personen. Google kann Daten in die USA übermitteln; "
    "Google ist nach dem EU-US Data Privacy Framework zertifiziert.</p>\n"
    "\n  <h3>3.2 Google Analytics 4</h3>\n"
    "  <p>Nach Einwilligung werten wir die Nutzung der Website mit Google Analytics 4 statistisch aus (Seitenaufrufe, Start des "
    "Riester-Checks, abgeschickte Anfragen, bestätigte Zahlungen). Die IP-Adresse wird gekürzt verarbeitet, Werbefunktionen sind "
    "deaktiviert; Berichte enthalten keine Namen oder E-Mail-Adressen. Rechtsgrundlage ist Ihre Einwilligung.</p>\n"
    "\n  <h3>3.3 Widerruf</h3>\n"
    "  <p>Sie können Ihre Entscheidung jederzeit über den Link „Cookie-Einstellungen“ im Fußbereich ändern; die Seite lädt dann "
    "neu und fragt erneut. Bereits gesetzte Google-Cookies löschen Sie über die Website-Daten Ihres Browsers.</p>")


def datenschutz():
    t = lese("datenschutz.html"); alt = t
    if "vf-rechtslinks" not in t: t = t.replace("</head>", LINK_CSS, 1)
    t = ersetze_einmal(t, '<link rel="icon" href="/assets/img/favicon.ico" type="image/x-icon">',
                       '<link rel="icon" href="/assets/img/favicon.png" type="image/png">', False)
    if "DATENDO" not in t:
        # hinter den Verantwortlichen-Absatz (vor der ersten h2 nach Abschnitt 1)
        t = ersetze_einmal(t, "\n  <h2>2. Erhobene Daten und Zwecke</h2>", DSB + "\n  <h2>2. Erhobene Daten und Zwecke</h2>", wo="datenschutz DSB")
    t = ersetze_einmal(t, COOKIES_ALT, COOKIES_NEU, wo="datenschutz Cookies")
    if t != alt:
        schreibe("datenschutz.html", t)


def huelle():
    h = lese("impressum.html")
    kopf = h[:h.index('<div class="page-wrap">')]
    fuss = h[h.index("<footer>"):]
    return kopf, fuss


def neue_seite(titel, beschreibung, inhalt, slug):
    kopf, fuss = huelle()
    kopf = re.sub(r"<title>[^<]*</title>", "<title>%s – Versicherungsfuchs</title>" % titel, kopf)
    kopf = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % beschreibung, kopf)
    kopf = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="https://versicherungs-fuchs.online/%s">' % slug, kopf)
    # rechtliches.py verlinkt im Regionalmarken-Schema (/impressum/) — VF hat .html-Seiten
    inhalt = re.sub(r'href="/(impressum|datenschutz|erstinformation|widerrufsbelehrung|bildnachweis)/"', r'href="/\1.html"', inhalt)
    return kopf + '<div class="page-wrap">\n  <h1>%s</h1>\n%s\n</div>\n\n' % (titel, inhalt) + fuss


def neue_seiten():
    if not os.path.exists(os.path.join(VF, "widerrufsbelehrung.html")):
        schreibe("widerrufsbelehrung.html", neue_seite(
            "Widerrufsbelehrung", "Widerrufsbelehrung fuer Verbraucher bei Maklervertraegen mit der iSurance Finanz- und Versicherungsvermittlungs UG.",
            R.widerrufsbelehrung_abschnitte(B), "widerrufsbelehrung"))
    if not os.path.exists(os.path.join(VF, "erstinformation.html")):
        schreibe("erstinformation.html", neue_seite(
            "Erstinformation nach § 15 VersVermV", "Erstinformation nach § 15 VersVermV: Vermittlerstatus, Register, Beteiligungen und Schlichtungsstellen.",
            R.erstinformation_abschnitte(B), "erstinformation"))
    if not os.path.exists(os.path.join(VF, "bildnachweis.html")):
        bild = ("<p class=\"lead\">Alle Bilder und Grafiken auf versicherungs-fuchs.online sind eigene Marken- und Werbegrafiken "
                "der iSurance Finanz- und Versicherungsvermittlungs UG (Fuchs-Logo, 3D-Fuchs im Kopfbereich, Vorschaubild, Icons) "
                "oder Darstellungen der eigenen Anwendung. Fremdes Bildmaterial wird nicht verwendet. Kommt Bildmaterial Dritter "
                "hinzu, wird es hier mit Urheber und Lizenz genannt.</p>"
                "<h2>Marken- und Logografiken</h2><p>Versicherungsfuchs-Logo, Slogan und 3D-Fuchs: © iSurance Finanz- und "
                "Versicherungsvermittlungs UG, alle Rechte vorbehalten.</p>"
                "<h2>KI-gestützte Analyse</h2><p>Die Auswertungen im Riester-Check entstehen mit Unterstützung von "
                "Sprachmodellen (siehe Impressum, Abschnitt „KI-gestützte Analyse“). Bilder werden auf dieser Website nicht "
                "mit KI erzeugt.</p>")
        schreibe("bildnachweis.html", neue_seite("Bildnachweis", "Herkunft und Rechte der Bilder und Grafiken auf versicherungs-fuchs.online.", bild, "bildnachweis"))


# ---------------------------------------------------------------------------------------------------- 2. Footer-Links
NEU_LINKS = [("/erstinformation.html", "Erstinformation"), ("/widerrufsbelehrung.html", "Widerruf"), ("/bildnachweis.html", "Bildnachweis")]
COOKIE_LINK = ("#", "Cookie-Einstellungen")


def footer_links(rel, t):
    if "<footer" not in t:
        return t
    a = t.index("<footer"); b = t.index("</footer>", a) + 9
    f = t[a:b]
    if "/widerrufsbelehrung.html" in f:
        return t
    # Variante 1: Startseite/Artikel — <h5>Rechtliches</h5><ul><li>…Datenschutz</li></ul>
    m = re.search(r'(<li><a href="/datenschutz\.html">Datenschutz</a></li>)', f)
    if m and "Rechtliches" in f:
        neu = m.group(1) + "".join("\n              <li><a href=\"%s\">%s</a></li>" % (h, n) for h, n in NEU_LINKS) \
            + "\n              <li><a href=\"#\" class=\"vf-cn-trigger\">Cookie-Einstellungen</a></li>"
        f = f.replace(m.group(1), neu, 1)
    else:
        # Variante 2: footer-brand — <a href="/datenschutz.html" class="footer-link">Datenschutz</a>
        m = re.search(r'(<a href="/datenschutz\.html" class="footer-link">Datenschutz</a>)', f)
        if m:
            neu = m.group(1) + "".join('<a href="%s" class="footer-link">%s</a>' % (h, n) for h, n in NEU_LINKS) \
                + '<a href="#" class="footer-link vf-cn-trigger">Cookie-Einstellungen</a>'
            f = f.replace(m.group(1), neu, 1)
        else:
            # Variante 3: footer-bottom-simple <nav> … <a href="/impressum.html">Impressum</a> …  bzw. check-anfrage /impressum
            m = re.search(r'(<a href="/impressum(?:\.html)?">Impressum</a>)', f)
            if not m:
                print("  ! Footer ohne bekannte Rechtslinks:", rel); return t
            sep = " · " if "/impressum\">" in m.group(1) else " "
            neu = m.group(1) + "".join('%s<a href="%s">%s</a>' % (sep, h, n) for h, n in NEU_LINKS) \
                + '%s<a href="#" class="vf-cn-trigger">Cookie-Einstellungen</a>' % sep
            f = f.replace(m.group(1), neu, 1)
    return t[:a] + f + t[b:]


# ---------------------------------------------------------------------------------------------------- 3. Messung
MESSUNG_JS = r"""/* VersicherungsFuchs — Ereignis-Schicht der Messung (16.09.2026, Port auf die Live-Basis).
   Das Google-Tag (AW-820163824 + G-VYF5P956SP) liegt im <head> jeder Seite mit Consent-Default „denied";
   assets/js/cookie-notice.js reicht die Entscheidung per gtag('consent','update') durch (Consent Mode).
   Hier nur die Schluesselereignisse — in GA4 als Key Events markieren:
     check_start       Riester-Check begonnen (Fragebogen, Frage 0)
     submit_lead_form  Kontakt am Ergebnis abgeschickt
     purchase          Stripe-Zahlung bestaetigt (transaction_id = PaymentIntent)
   Ein page_view je Seite kommt aus gtag('config') im <head> — hier kein zweites config (Memory page-view-doppelt). */
(function () {
  function einwilligung() {
    try { return localStorage.getItem('vf_cookie_consent') === 'accepted'; } catch (e) { return false; }
  }
  window.vfEvent = function (name, params) {
    if (typeof window.gtag !== 'function') return;
    var p = params || {};
    p.consent = einwilligung() ? 'accepted' : 'necessary';
    try { window.gtag('event', name, p); } catch (e) {}
  };
})();
"""
MESSUNG_TAG = '<script defer src="/assets/js/vf-messung.js?v=1"></script>'


def messung_js():
    p = os.path.join(VF, "assets", "js", "vf-messung.js")
    if not os.path.exists(p) or io.open(p, encoding="utf-8").read() != MESSUNG_JS:
        schreibe("assets/js/vf-messung.js", MESSUNG_JS)


def messung_seite(t):
    if "cookie-notice.js" in t and "vf-messung.js" not in t and "</body>" in t:
        t = t.replace("</body>", MESSUNG_TAG + "\n</body>", 1)
    # Cache-Busting fuer das geaenderte Banner-Skript (/assets/* ist 1 Jahr immutable gecacht)
    t = t.replace('src="/assets/js/cookie-notice.js"></script>', 'src="/assets/js/cookie-notice.js?v=%s"></script>' % V)
    t = t.replace('href="/assets/css/cookie-notice.css">', 'href="/assets/css/cookie-notice.css?v=%s">' % V)
    return t


def messung_ereignisse():
    rel = "riester-check/result/index.html"; t = lese(rel); alt = t
    t = ersetze_einmal(t, "      vfSaveLead({name:name,email:email});\n",
                       "      vfSaveLead({name:name,email:email});\n      if(window.vfEvent)vfEvent('submit_lead_form',{source:'riester-check'});\n", wo="result lead")
    t = ersetze_einmal(t, "          vfPaymentId=result.paymentIntent.id;\n",
                       "          vfPaymentId=result.paymentIntent.id;\n          if(window.vfEvent)vfEvent('purchase',{currency:'EUR',transaction_id:vfPaymentId,items:[{item_name:'riester-check-'+tier}]});\n", wo="result purchase")
    # Stripe.js wurde nie geladen (kein <script src=js.stripe.com> im Repo, CSP liess es auch nicht zu) — beim Oeffnen nachladen
    t = ersetze_einmal(t, "  function _openPayModal(priceLabel,title,sub,cs,tier){\n",
                       "  function _openPayModal(priceLabel,title,sub,cs,tier){\n"
                       "    if(typeof Stripe==='undefined'){var _a=arguments;var s=document.createElement('script');s.src='https://js.stripe.com/v3/';"
                       "s.onload=function(){_openPayModal.apply(null,_a);};s.onerror=function(){alert('Zahlungsmodul konnte nicht geladen werden. Bitte erneut versuchen.');};"
                       "document.head.appendChild(s);return;}\n", wo="result Stripe")
    if t != alt: schreibe(rel, t)
    rel = "riester-check/q/index.html"; t = lese(rel); alt = t
    if "vfEvent('check_start'" not in t:
        t = t.replace("</body>", "<script>window.addEventListener('load',function(){if(/[?&]n=0(&|$)/.test(location.search)&&window.vfEvent)vfEvent('check_start',{source:'riester-check'});});</script>\n</body>", 1)
    if t != alt: schreibe(rel, t)


def banner():
    rel = "assets/js/cookie-notice.js"; t = lese(rel); alt = t
    t = t.replace("   - Eine Stufe: Marketing (Google Ads Conversion-Messung). GA4 laeuft hier nicht.",
                  "   - Eine Stufe: Marketing (Google Ads Conversion-Messung + Google Analytics 4, beide im <head>).")
    t = ersetze_einmal(t, "      + '    Optional messen wir, ueber welche Anzeige Sie zu uns gefunden haben'\n"
                       "      + '    (Google Ads). Sie entscheiden - jederzeit widerrufbar. Details in der'\n",
                       "      + '    Optional messen wir, ueber welche Anzeige Sie zu uns gefunden haben'\n"
                       "      + '    (Google Ads) und wie die Seite genutzt wird (Google Analytics 4). Sie entscheiden -'\n"
                       "      + '    jederzeit widerrufbar ueber „Cookie-Einstellungen\" im Fussbereich. Details in der'\n", wo="banner text")
    if t != alt: schreibe(rel, t)
    # Banner-CSS: Weiss auf CI-Orange (#e2691a) = 3,4:1 — Lighthouse color-contrast. Gleiche Regel wie fuer alle CTAs
    # (Sven 07-23: Markenfarbe bleibt, Schrift dunkel).
    rel = "assets/css/cookie-notice.css"; t = lese(rel); alt = t
    t = ersetze_einmal(t, ".vf-cn__btn--accept{background:#e2691a;color:#fff}", ".vf-cn__btn--accept{background:#e2691a;color:#1b1b1f}", wo="banner css")
    # Rechtsseiten setzen h2 auf #f2f2f2 (dunkles Theme) — der Banner-Titel war dort weiss auf weiss (1,1:1)
    t = ersetze_einmal(t, ".vf-cn__title{margin:0 0 .4rem;font-size:1rem;font-weight:700}",
                       ".vf-cn__title{margin:0 0 .4rem;font-size:1rem;font-weight:700;color:#1b1b1f}", wo="banner title")
    if t != alt: schreibe(rel, t)


# ---------------------------------------------------------------------------------------------------- 4. CSP
CSP_PLUS = {
    "script-src": ["https://js.stripe.com", "https://s.provenexpert.net"],
    "img-src": ["https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.provenexpert.com", "https://*.provenexpert.net"],
    "connect-src": ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://api.stripe.com", "https://*.provenexpert.com", "https://*.provenexpert.net"],
    "frame-src": ["https://js.stripe.com", "https://hooks.stripe.com", "https://www.provenexpert.com"],
    "font-src": ["https://*.provenexpert.com"],
}


def headers():
    t = lese("_headers"); alt = t
    m = re.search(r"^(  Content-Security-Policy: )(.*)$", t, re.M)
    if not m: raise SystemExit("CSP fehlt in _headers")
    teile = [x.strip() for x in m.group(2).split(";") if x.strip()]
    neu = []
    for teil in teile:
        name, _, rest = teil.partition(" ")
        werte = rest.split()
        for w in CSP_PLUS.get(name, []):
            if w not in werte: werte.append(w)
        neu.append(name + " " + " ".join(werte))
    t = t[:m.start(2)] + "; ".join(neu) + t[m.end(2):]
    if t != alt: schreibe("_headers", t)
    r = lese("_redirects"); alt = r
    for slug in ("erstinformation", "widerrufsbelehrung", "bildnachweis"):
        z = "/%s       /%s.html        200" % (slug, slug)
        if "/%s " % slug not in r:
            r = r.replace("/impressum         /impressum.html          200\n", "/impressum         /impressum.html          200\n" + z + "\n", 1)
    if r != alt: schreibe("_redirects", r)


# ---------------------------------------------------------------------------------------------------- 5. Siegel
SIEGEL_CSS = ("<style id=\"vf-siegel-css\">.vf-siegel{position:fixed;right:18px;bottom:24px;z-index:50;display:none;min-width:120px;min-height:20px;opacity:0;"
              "transform:translateY(14px);pointer-events:none;transition:opacity .35s,transform .35s}.vf-siegel.ist-da{opacity:1;transform:none;pointer-events:auto}"
              ".vf-pe-fallback{display:flex;flex-direction:column;gap:2px;padding:10px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.12);"
              "background:#151515;color:#f1f1f1;text-decoration:none;font-size:.8rem;line-height:1.3;box-shadow:0 14px 40px -18px rgba(0,0,0,.6)}"
              ".vf-pe-fallback b{font-size:.95rem}.vf-pe-fallback span{color:#999}@media(min-width:900px){.vf-siegel{display:flex}}"
              "@media(prefers-reduced-motion:reduce){.vf-siegel{transition:none}}@media print{.vf-siegel{display:none}}</style>")
SIEGEL_HTML = ("<div class=\"vf-siegel\" aria-label=\"Kundenbewertungen auf ProvenExpert\"><div id=\"proSealWidget\"></div>"
               "<a class=\"vf-pe-fallback\" href=\"https://www.provenexpert.com/isurance/\" rel=\"noopener\" target=\"_blank\">"
               "<b>Kundenbewertungen</b><span>auf ProvenExpert ansehen</span></a></div>\n<script defer src=\"/assets/js/vf-siegel.js?v=1\"></script>\n")
SIEGEL_JS = r"""/* VersicherungsFuchs — ProvenExpert-PRO-Siegel in VF-CI (15.09.2026, Standard wie auf allen Marken, trust.py):
   Container rechts unten, ab 900 px, erst sichtbar unter dem Kopfbereich; Widget-ID = iSurance-Profil (5 Marken).
   Ohne JS/vor dem Laden steht der Profil-Link. */
(function () {
  var WIDGET = 'e4d41697-b61a-483f-9e11-4b1da4244d2a', geladen = false;
  function init() {
    var el = document.getElementById('proSealWidget'); if (!el || geladen || innerWidth < 900) return; geladen = true;
    var wrap = el.parentElement, fb = wrap && wrap.querySelector('.vf-pe-fallback');
    function fertig() { if (el.children.length && fb) fb.style.display = 'none'; }
    window.loadProSeal = function () {
      if (window.provenExpert && window.provenExpert.proSeal) {
        window.provenExpert.proSeal({ widgetId: WIDGET, language: 'de-DE', usePageLanguage: false, bannerColor: '#f97316', textColor: '#FFFFFF',
          showBackPage: false, showReviews: false, hideDate: true, hideName: false, googleStars: false, displayReviewerLastName: false, embeddedSelector: '#proSealWidget' });
        if ('MutationObserver' in window) new MutationObserver(fertig).observe(el, { childList: true }); setTimeout(fertig, 2500);
      }
    };
    var s = document.createElement('script'); s.src = 'https://s.provenexpert.net/seals/proseal-v2.js'; s.async = true;
    s.onload = window.loadProSeal; s.onerror = function () { geladen = false; }; document.head.appendChild(s);
  }
  function kopfEnde() { var h = document.querySelector('main > section, header + section, .hero, section'); return h ? h.getBoundingClientRect().bottom + scrollY : 500; }
  function zeige() { var w = document.querySelector('.vf-siegel'); if (!w) return; w.classList.toggle('ist-da', scrollY > kopfEnde() - 80); }
  addEventListener('scroll', zeige, { passive: true }); addEventListener('load', function () { setTimeout(zeige, 400); }); zeige();
  if (document.readyState === 'complete') setTimeout(init, 300); else addEventListener('load', function () { setTimeout(init, 300); });
  addEventListener('resize', function () { if (innerWidth >= 900) init(); });
})();
"""
SIEGEL_SEITEN = ["index.html", "riester-check/index.html", "bu-check.html", "renten-check.html", "baufi-check.html", "news/index.html", "versicherungs-check/index.html"]


def siegel():
    p = os.path.join(VF, "assets", "js", "vf-siegel.js")
    if not os.path.exists(p) or io.open(p, encoding="utf-8").read() != SIEGEL_JS:
        schreibe("assets/js/vf-siegel.js", SIEGEL_JS)


def siegel_seite(rel, t):
    if rel not in SIEGEL_SEITEN: return t
    if "vf-siegel-css" not in t: t = t.replace("</head>", SIEGEL_CSS + "\n</head>", 1)
    if "vf-siegel.js" not in t: t = t.replace("</body>", SIEGEL_HTML + "</body>", 1)
    return t


# ---------------------------------------------------------------------------------------------------- 6. Aussagen, Links, Ueberschriften
AUSSAGEN = {
    "index.html": [
        ("Keine Provisionen, keine versteckten Interessen", "Für den Check keine Provision — Courtage nur, wenn Sie später freiwillig über iSurance abschließen"),
        ("Ihre Angaben werden nicht an Versicherungen, Makler oder Dritte weitergegeben.",
         "Ihre Angaben werden nicht an Versicherer verkauft oder weitergegeben. Technische Dienstleister (Zahlung, Hosting, KI-Auswertung) nennt die Datenschutzerklärung."),
        ("Ein kostenloses Prüf-Werkzeug der iSurance Gruppe:", "Ein Prüf-Werkzeug der iSurance Gruppe (Ampel-Einordnung kostenlos):"),
    ],
    "renten-check.html": [("Was sind die besten Vorsorge-Produkte 2026?", "Welche Vorsorge-Produkte lohnen sich 2026?")],
}


def aussagen(rel, t):
    for alt, neu in AUSSAGEN.get(rel, []):
        t = t.replace(alt, neu)
    return t


def ueberschriften(rel, t):
    if rel != "index.html": return t
    t = re.sub(r'(<div class="step-num">\d</div>\s*)<h4>(.*?)</h4>', r'\1<h3>\2</h3>', t)
    t = re.sub(r'(<div class="news-tag">.*?</div>\s*)<h4>(.*?)</h4>', r'\1<h3>\2</h3>', t)
    t = t.replace(".step h4 {", ".step h3 {").replace(".news-card h4 {", ".news-card h3 {")
    t = re.sub(r'<h5>(Tools|Kontakt|Rechtliches)</h5>', r'<p class="footer-h">\1</p>', t)
    t = t.replace(".footer-links h5 {", ".footer-links .footer-h {")
    return t


# ---------------------------------------------------------------------------------------------------- Lauf
if __name__ == "__main__":
    impressum(); datenschutz(); neue_seiten()
    messung_js(); banner(); messung_ereignisse(); headers(); siegel()
    for rel in list(seiten()):
        t = lese(rel); alt = t
        t = footer_links(rel, t)
        t = messung_seite(t)
        t = siegel_seite(rel, t)
        t = aussagen(rel, t)
        t = ueberschriften(rel, t)
        if t != alt: schreibe(rel, t)
    print("geaendert (%d):" % len(GEAENDERT))
    for g in GEAENDERT: print("  ", g)
