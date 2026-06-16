/**
 * VersicherungsFuchs — Hero Fox-Mark Choreography
 * Bildmarke (V + Fuchs) dreht sich um die eigene Achse, hüpft hoch, und beim
 * Landen pulsiert ein Ring aus der Mitte. Auto alle 60s + bei Maus-Hover.
 * Vanilla JS, GPU-only (transform/opacity), reduced-motion-safe.
 */
(function () {
  'use strict';
  var box = document.getElementById('vf-mark');
  if (!box) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SPIN_HOP_MS = 1950;   // Dauer Spin+Hüpfen (muss zu @keyframes vfSpinHop passen)
  var LAND_MS     = 1440;   // Zeitpunkt des Aufpralls (74% von 1.95s) -> Bodenwelle startet
  var RIPPLE_MS   = 1500;   // Dauer Ripple
  var playing = false;

  function play() {
    if (playing) return;
    playing = true;
    box.classList.add('is-playing');

    var rippleTimer = setTimeout(function () {
      box.classList.add('is-rippling');
      setTimeout(function () { box.classList.remove('is-rippling'); }, RIPPLE_MS);
    }, LAND_MS);

    setTimeout(function () {
      box.classList.remove('is-playing');
      playing = false;
    }, SPIN_HOP_MS);
  }

  // Erstes Mal nach dem Laden
  play();
  // Wiederholung ~jede Minute
  setInterval(play, 60000);
  // Bei direktem Hover über die Marke
  box.addEventListener('mouseenter', play);

  // Pause/kein Stau, wenn Tab versteckt
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { box.classList.remove('is-playing', 'is-rippling'); playing = false; }
  });
}());
