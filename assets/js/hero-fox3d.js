/*
 * hero-fox3d.js — VersicherungsFuchs · 3D/Scroll Tier 3
 * Signature-Moment: ein stilisierter Low-Poly-/Wireframe-Fuchskopf (Three.js),
 * der ruhig rotiert und beim Scrollen sanft kippt.
 *
 * Hartregeln: Three.js wird LAZY geladen (erst wenn die Sektion naht -> LCP-safe),
 * GPU-only, prefers-reduced-motion -> kein Canvas (statisch leer), Mobile -> reduzierte
 * Detailstufe. Genau EIN Signature-3D-Moment pro Seite.
 */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var mount = document.getElementById('vf-fox3d');
  if (!mount) return;

  var THREE_URL = 'https://unpkg.com/three@0.128.0/build/three.min.js';
  var started = false;

  function ensureThree(cb) {
    if (window.THREE) return cb();
    var ex = document.querySelector('script[data-three]');
    if (ex) { ex.addEventListener('load', cb, { once: true }); return; }
    var s = document.createElement('script');
    s.src = THREE_URL; s.async = true; s.setAttribute('data-three', '1');
    s.onload = cb;
    s.onerror = function () { mount.style.display = 'none'; }; // CDN weg -> sauber verbergen
    document.head.appendChild(s);
  }

  function build() {
    if (started || !window.THREE) return;
    var W = mount.clientWidth, H = mount.clientHeight;
    if (!W || !H) return setTimeout(build, 120);
    started = true;

    var ORANGE = 0xff7a00, BEIGE = 0xc6ab7f;
    var small = W < 420;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
    mount.appendChild(renderer.domElement);

    function wire(geo, color, op) {
      return new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: op })
      );
    }

    var fox = new THREE.Group();
    // Kopf — facettierte Kugel
    fox.add(wire(new THREE.IcosahedronGeometry(1, 1), ORANGE, 0.55));
    // Schnauze — Kegel nach vorn (+z), leicht nach unten
    var snout = wire(new THREE.ConeGeometry(0.5, 0.95, 6), ORANGE, 0.6);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.28, 0.92);
    fox.add(snout);
    // Ohren — zwei Kegel oben, nach außen geneigt (Beige-Akzent)
    function ear(x) {
      var e = wire(new THREE.ConeGeometry(0.34, 0.72, 4), BEIGE, 0.62);
      e.position.set(x, 0.96, 0.05);
      e.rotation.z = x > 0 ? -0.32 : 0.32;
      return e;
    }
    fox.add(ear(-0.56));
    fox.add(ear(0.56));
    scene.add(fox);

    // Scroll-Kopplung: Tilt aus der Sektions-Position im Viewport
    var scrollRot = 0;
    function onScroll() {
      var rect = mount.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var center = rect.top + rect.height / 2;
      scrollRot = ((center - vh / 2) / vh); // ~ -0.5 (oben) .. +0.5 (unten)
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function animate() {
      fox.rotation.y += 0.0035; // ruhiger Idle-Spin
      var targetX = 0.12 - scrollRot * 0.42; // sanfter Scroll-Tilt
      fox.rotation.x += (targetX - fox.rotation.x) * 0.06;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    var rtid;
    window.addEventListener('resize', function () {
      clearTimeout(rtid);
      rtid = setTimeout(function () {
        var w = mount.clientWidth, h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }, 150);
    });
  }

  // Lazy-Trigger: erst laden/bauen, wenn die Sektion in Sichtweite kommt.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); ensureThree(build); }
      });
    }, { rootMargin: '300px 0px 300px 0px' });
    io.observe(mount);
  } else {
    ensureThree(build);
  }
})();
