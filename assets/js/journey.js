/* VersicherungsFuchs — Journey v1.0 (Scroll-Choreografie)
 * Lenis smooth-scroll + GSAP ScrollTrigger.
 * Akt "Haus der Checks": die Modules-Sektion wird gepinnt; beim Scrollen wird man
 * durch die Checks GEFÜHRT — sie aktivieren nacheinander (Orange-Highlight wandert durch).
 *
 * Hartregeln: GPU-only (autoAlpha/y/scale), CDN lazy via defer, init erst nach load (LCP-safe).
 * prefers-reduced-motion -> komplett aus. Mobile (<880px) -> kein Pin, normales Layout.
 * CDN fehlt -> graceful: ganz normales Scrollen, nichts bricht.
 */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return; // GSAP-CDN nicht da -> normales Scrollen
    gsap.registerPlugin(ScrollTrigger);

    // ── Lenis smooth-scroll (Premium-Feel, site-weit) ──
    if (window.Lenis) {
      try {
        var lenis = new Lenis({
          duration: 1.1,
          smoothWheel: true,
          easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } catch (e) { /* Lenis optional */ }
    }

    // ── Akt "Haus der Checks": gepinnter, geführter Walkthrough (nur Desktop) ──
    ScrollTrigger.matchMedia({
      '(min-width: 880px)': function () {
        var sec = document.querySelector('.modules');
        var cards = sec ? gsap.utils.toArray(sec.querySelectorAll('.module-card')) : [];
        if (!sec || cards.length < 2) return;

        gsap.set(cards, { autoAlpha: 0.4, y: 24, scale: 0.975 });

        function setActive(idx) {
          cards.forEach(function (c, j) { c.classList.toggle('active', j === idx); });
        }

        var per = 200; // Scroll-Distanz pro Check
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: sec,
            start: 'top top',
            end: '+=' + (cards.length * per),
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        cards.forEach(function (card, i) {
          tl.to(card, {
            autoAlpha: 1, y: 0, scale: 1, ease: 'power2.out',
            onStart: function () { setActive(i); },
            onReverseComplete: function () { setActive(Math.max(0, i - 1)); }
          }, i);
          tl.to({}, { duration: 0.35 }); // kurze Verweildauer je Check (Führungs-Rhythmus)
        });
      }
    });

    ScrollTrigger.refresh();
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
