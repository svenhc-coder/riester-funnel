/* VersicherungsFuchs — Ereignis-Schicht der Messung (16.09.2026, Port auf die Live-Basis).
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
