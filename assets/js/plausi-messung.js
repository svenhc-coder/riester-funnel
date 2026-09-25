/* VersicherungsFuchs — GA4-Ereignis „formular_plausi_block" (25.09.2026, Koordinator-Vorgabe plausi v1.1.0).
   Zaehlt, wenn die Plausi-Pruefung (assets/js/plausi.js) ein Absenden blockiert: pro blockiertem Feld EIN Ereignis
   gtag('event','formular_plausi_block',{feld:'name'|'email'|'telefon'}) — nur der data-plausi-Typ, KEINE Eingabewerte.
   plausi.js selbst bleibt unveraendert (gemeinsame Datei aller Marken).

   Zwei Wege, wie ein Absendeversuch blockiert wird:
   1) submit-Event: plausi.js prueft in der Capture-Phase am <form> und ruft preventDefault. Der Listener hier sitzt
      am document (Capture laeuft VOR dem Form-Listener) und wertet per setTimeout erst danach aus. Weil die
      fetch-Handler der Seiten ebenfalls preventDefault rufen, zaehlen nur Felder mit aria-invalid="true".
   2) Native Validierung: hat plausi.js beim Verlassen eines Feldes schon setCustomValidity gesetzt, blockt der
      Browser das naechste Absenden selbst — dann gibt es kein submit-Event, aber je Feld ein „invalid"-Event.
   Pro Absendeversuch (gleicher Task) wird jedes Feld hoechstens einmal gezaehlt.
   Ohne window.gtag passiert nichts (kein dataLayer anlegen). Consent: gtag ist der Consent-Mode-Stub der Seite;
   Google-Requests entstehen erst nach Einwilligung (vf-messung.js). */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  var gemeldet = null;

  function melden(felder) {
    if (typeof window.gtag !== 'function' || !felder.length) return;
    if (!gemeldet) {
      gemeldet = {};
      setTimeout(function () { gemeldet = null; }, 0);   // naechster Absendeversuch zaehlt neu
    }
    felder.forEach(function (el) {
      var typ = el.getAttribute('data-plausi');
      if (!typ || gemeldet[typ + '#' + (el.id || el.name || '')]) return;
      gemeldet[typ + '#' + (el.id || el.name || '')] = 1;
      try { window.gtag('event', 'formular_plausi_block', { feld: typ }); } catch (e) { /* Messung darf nie stoeren */ }
    });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    setTimeout(function () {
      if (!e.defaultPrevented || !form || !form.querySelectorAll) return;
      melden(Array.prototype.slice.call(form.querySelectorAll('[data-plausi][aria-invalid="true"]')));
    }, 0);
  }, true);

  document.addEventListener('invalid', function (e) {
    var el = e.target;
    if (el && el.getAttribute && el.getAttribute('data-plausi') && el.getAttribute('aria-invalid') === 'true') melden([el]);
  }, true);
})();
