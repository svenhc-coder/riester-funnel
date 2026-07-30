/* VersicherungsFuchs Cookie-Hinweis - TDDDG-konform (§ 25 TDDDG, DSK 2023).
   - "Nur notwendige" und "Alle akzeptieren" gleichberechtigt auf der ersten Ebene
   - Eine Stufe: Marketing (Google Ads Conversion-Messung). GA4 laeuft hier nicht.
   - Persistenz: localStorage 'vf_cookie_consent' = 'accepted' | 'necessary'
   - Widerruf: Link mit class="vf-cn-trigger" -> zuruecksetzen + neu laden
   Das Google-Tag liegt im <head> jeder Seite mit Consent-Default "denied".
   Hier wird die Entscheidung des Nutzers per gtag(consent,update) durchgereicht. */
(function () {
  'use strict';

  var KEY = 'vf_cookie_consent';
  var BOX = null;

  function readConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function writeConsent(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function updateConsent(granted) {
    var state = granted ? 'granted' : 'denied';
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      ad_storage:         state,
      ad_user_data:       state,
      ad_personalization: state,
      analytics_storage:  state
    });
  }
  function build() {
    var el = document.createElement('div');
    el.className = 'vf-cn';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', 'vf-cn-title');
    el.setAttribute('aria-describedby', 'vf-cn-desc');
    el.innerHTML = ''
      + '<div class="vf-cn__inner">'
      + '  <h2 id="vf-cn-title" class="vf-cn__title">Cookies &amp; Datenschutz</h2>'
      + '  <p id="vf-cn-desc" class="vf-cn__body">'
      + '    Technisch notwendige Cookies brauchen wir, damit die Seite funktioniert.'
      + '    Optional messen wir, ueber welche Anzeige Sie zu uns gefunden haben'
      + '    (Google Ads). Sie entscheiden - jederzeit widerrufbar. Details in der'
      + '    <a href="/datenschutz.html">Datenschutzerklaerung</a>.'
      + '  </p>'
      + '  <div class="vf-cn__actions">'
      + '    <button type="button" class="vf-cn__btn vf-cn__btn--accept" data-vf-cn="accept">Alle akzeptieren</button>'
      + '    <button type="button" class="vf-cn__btn vf-cn__btn--reject" data-vf-cn="reject">Nur notwendige</button>'
      + '  </div>'
      + '</div>';
    return el;
  }
  function show() {
    if (BOX) return;
    BOX = build();
    document.body.appendChild(BOX);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (BOX) BOX.classList.add('is-visible'); });
    });
    BOX.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-vf-cn]');
      if (!t) return;
      var a = t.getAttribute('data-vf-cn');
      if (a === 'accept') { writeConsent('accepted');  updateConsent(true);  hide(); }
      else                { writeConsent('necessary'); updateConsent(false); hide(); }
    });
  }
  function hide() {
    if (!BOX) return;
    BOX.classList.remove('is-visible');
    setTimeout(function () {
      if (BOX && BOX.parentNode) BOX.parentNode.removeChild(BOX);
      BOX = null;
    }, 320);
  }
  function init() {
    var v = readConsent();
    if (v === 'accepted')  { updateConsent(true);  return; }
    if (v === 'necessary') { updateConsent(false); return; }
    show();
  }
  function bindReset() {
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('.vf-cn-trigger');
      if (!t) return;
      e.preventDefault();
      try { localStorage.removeItem(KEY); } catch (err) {}
      location.reload();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); bindReset(); });
  } else { init(); bindReset(); }
})();

/* Wird von den Formularseiten aufgerufen, sobald ein Lead erfolgreich uebermittelt wurde.
   Ohne Marketing-Zustimmung ist window.gtag zwar da, das Signal traegt aber kein
   Werbe-Cookie - Google zaehlt dann nur modelliert statt gemessen. */
window.vfAdsConversion = function () {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    'send_to':  'AW-820163824/B3c6CLqJ_NgcEPDpiocD',
    'value':    1.0,
    'currency': 'EUR'
  });
};
