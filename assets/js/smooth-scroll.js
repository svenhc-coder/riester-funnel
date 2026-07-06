/* VersicherungsFuchs — Smooth-Scroll (Lenis, self-hosted).
   iSurance-Standard 2026-06-30: duration 1.1 / lerp 0.09, reduced-motion-safe. */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.__lenisStarted) return; window.__lenisStarted = true;
  var s = document.createElement('script');
  s.src = '/assets/js/lenis.min.js'; s.defer = true;
  s.onload = function () {
    if (!window.Lenis) return;
    var lenis = window.__vfLenis = new window.Lenis({ duration: 1.1, lerp: 0.09, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  };
  document.head.appendChild(s);
})();
