/**
 * VersicherungsFuchs — Hero Config
 *
 * mode: 'B'  → Three.js wireframe spheres (default, live)
 * mode: 'A'  → Cinematische Fuchs-SVG-Animation (set manually to test)
 *
 * To switch: change 'B' → 'A' and include hero-fox.js
 */
window.HERO_CONFIG = {
  mode: 'B'
};

/* GA4 — consent-gated (TDDDG §25): laedt erst nach Cookie-Zustimmung ('accepted'), anonymize_ip. */
(function () {
  var GA4 = 'G-VYF5P956SP';
  window.loadVfGA4 = function () {
    if (window.__vf_ga4) return; window.__vf_ga4 = true;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', GA4, { anonymize_ip: true });
  };
  function maybe() { try { if (localStorage.getItem('vf_cookie_consent') === 'accepted') window.loadVfGA4(); } catch (e) {} }
  if (document.readyState !== 'loading') maybe(); else document.addEventListener('DOMContentLoaded', maybe);
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('cookie-btn-accept')) setTimeout(window.loadVfGA4, 50);
  });
})();
