/*
 * scroll-reveal.js — VersicherungsFuchs · 3D/Scroll Tier 1+2 (additiv)
 *
 * Tier 2 (Scrollytelling): Inhaltsblöcke morphen beim Scrollen gestaffelt rein
 *   (IntersectionObserver, GPU-only: opacity + transform).
 * Tier 1 (Tiefe): sehr dezente Scroll-Parallax auf dekorativen Layern (Hero-Glow,
 *   Sektions-Glow) — NIE auf Logo/Stage (Hero-Hartregel: Marke bleibt Anker, still).
 * Scroll-Progress-Faden: dünne Fuchs-Orange-Linie oben, füllt sich mit dem Scroll
 *   ("Reise"-Andeutung).
 *
 * Hartregeln (HERO-ANIMATION-Standards): GPU-only, prefers-reduced-motion komplett
 * respektiert, Inhalt ohne JS sichtbar (Graceful Degradation), kein Funnel-Code.
 */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced-Motion: nichts animieren, alles im sichtbaren End-Zustand lassen.
  // (Die versteckten Start-Zustände hängen an .vf-anim; die setzen wir dann gar nicht.)
  if (reduce) return;

  // --- Reveal-Targets: bekannte Inhaltsblöcke + alles mit [data-reveal] ---
  var SELECTORS = [
    '.hero-badge', '.hero__content h1', '.hero__content p', '.hero-actions',
    '.trust-item',
    '.section-label', '.section-title', '.section-sub',
    '.module-card', '.step', '.not-card', '.news-card',
    '.app-badge', '.app-title', '.app-sub', '.app-store-row',
    '.cta-section h2', '.cta-section p', '.cta-section .btn-primary',
    '[data-reveal]'
  ];

  function setup() {
    // .vf-anim aktiviert die versteckten Start-Zustände (siehe CSS). Erst JETZT setzen,
    // damit ohne JS nichts versteckt bleibt.
    docEl.classList.add('vf-anim');

    var nodes = [];
    try { nodes = Array.prototype.slice.call(document.querySelectorAll(SELECTORS.join(','))); }
    catch (e) { nodes = []; }

    // Stagger pro direktem Eltern-Container (Karten einer Gruppe laufen versetzt rein).
    var groupCounters = [];
    function groupIndex(el) {
      var p = el.parentNode;
      for (var i = 0; i < groupCounters.length; i++) {
        if (groupCounters[i].p === p) return ++groupCounters[i].n;
      }
      groupCounters.push({ p: p, n: 0 });
      return 0;
    }

    nodes.forEach(function (el) {
      el.classList.add('vf-reveal');
      var gi = groupIndex(el);
      if (gi > 0) el.style.setProperty('--vf-d', Math.min(gi * 70, 420) + 'ms');
    });

    // Failsafe: falls IntersectionObserver fehlt → alles sofort zeigen.
    if (!('IntersectionObserver' in window)) {
      docEl.classList.add('vf-anim-done');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    nodes.forEach(function (el) { io.observe(el); });

    // --- Tier 1: dezente Scroll-Parallax auf dekorativen Layern (rAF-gedrosselt) ---
    var glows = Array.prototype.slice.call(document.querySelectorAll('.hero__glow, [data-parallax]'));
    var progress = document.getElementById('vf-scroll-progress');
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset || docEl.scrollTop || 0;
        // Glow driftet langsamer als der Scroll (Tiefe), nur dekorativ, nie das Logo.
        for (var i = 0; i < glows.length; i++) {
          var speed = parseFloat(glows[i].getAttribute('data-parallax')) || 0.12;
          glows[i].style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
        }
        if (progress) {
          var h = docEl.scrollHeight - window.innerHeight;
          progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0).toFixed(4) + ')';
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else { setup(); }
})();
