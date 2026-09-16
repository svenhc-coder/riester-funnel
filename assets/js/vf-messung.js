/* VersicherungsFuchs — Messung, Consent BASIC (16.09.2026, Sven-Freigabe; Standard aller Marken, messung.py):
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
