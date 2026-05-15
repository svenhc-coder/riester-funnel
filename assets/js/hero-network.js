/**
 * VersicherungsFuchs — Hero Network Animation (Option B)
 * Two counter-rotating wireframe icosahedrons around the brand V logo.
 * Three.js r128 · vanilla JS · no modules
 */
(function () {
  'use strict';

  // ── Guards ──────────────────────────────────────────────────────────────
  var cfg = window.HERO_CONFIG || {};
  if (cfg.mode === 'A') return; // Option A handled by hero-fox.js

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  // ── Wait for THREE ───────────────────────────────────────────────────────
  var attempts = 0;
  function init() {
    if (typeof THREE === 'undefined') {
      if (++attempts > 100) return; // give up after 5 s
      setTimeout(init, 50);
      return;
    }
    boot();
  }

  function boot() {
    var parent = canvas.parentElement;
    var W = parent.offsetWidth  || 420;
    var H = parent.offsetHeight || 420;

    // Renderer
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    // Scene + Camera
    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 3.8;

    // ── Outer sphere · orange · detail 2 · clockwise y+x ─────────────────
    var geoOuter = new THREE.IcosahedronGeometry(1.55, 2);
    var matOuter = new THREE.MeshBasicMaterial({
      color:       0xf97316,   // --primary
      wireframe:   true,
      transparent: true,
      opacity:     0.18
    });
    var meshOuter = new THREE.Mesh(geoOuter, matOuter);
    scene.add(meshOuter);

    // ── Inner sphere · beige · detail 3 · counter y+z ────────────────────
    var geoInner = new THREE.IcosahedronGeometry(1.05, 3);
    var matInner = new THREE.MeshBasicMaterial({
      color:       0xC9B189,   // brand beige / V colour
      wireframe:   true,
      transparent: true,
      opacity:     0.28
    });
    var meshInner = new THREE.Mesh(geoInner, matInner);
    scene.add(meshInner);

    // ── Render loop ───────────────────────────────────────────────────────
    var raf = null;
    var paused = false;

    function tick() {
      if (paused) return;
      raf = requestAnimationFrame(tick);

      meshOuter.rotation.y += 0.0028;
      meshOuter.rotation.x += 0.0010;

      meshInner.rotation.y -= 0.0038;
      meshInner.rotation.z += 0.0018;

      renderer.render(scene, camera);
    }

    tick();

    // ── Pause when tab hidden ─────────────────────────────────────────────
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(raf);
      } else {
        paused = false;
        tick();
      }
    });

    // ── Responsive resize ─────────────────────────────────────────────────
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () {
        var w = parent.offsetWidth;
        var h = parent.offsetHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }).observe(parent);
    }
  }

  // Kick off after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
