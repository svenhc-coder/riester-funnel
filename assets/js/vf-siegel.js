/* VersicherungsFuchs — ProvenExpert-PRO-Siegel in VF-CI (15.09.2026, Standard wie auf allen Marken, trust.py):
   Container rechts unten, ab 900 px, erst sichtbar unter dem Kopfbereich; Widget-ID = iSurance-Profil (5 Marken).
   Ohne JS/vor dem Laden steht der Profil-Link. */
(function () {
  var WIDGET = 'e4d41697-b61a-483f-9e11-4b1da4244d2a', geladen = false;
  function init() {
    var el = document.getElementById('proSealWidget'); if (!el || geladen || innerWidth < 900) return; geladen = true;
    var wrap = el.parentElement, fb = wrap && wrap.querySelector('.vf-pe-fallback');
    function fertig() { if (el.children.length && fb) fb.style.display = 'none'; }
    window.loadProSeal = function () {
      if (window.provenExpert && window.provenExpert.proSeal) {
        window.provenExpert.proSeal({ widgetId: WIDGET, language: 'de-DE', usePageLanguage: false, bannerColor: '#f97316', textColor: '#FFFFFF',
          showBackPage: false, showReviews: false, hideDate: true, hideName: false, googleStars: false, displayReviewerLastName: false, embeddedSelector: '#proSealWidget' });
        if ('MutationObserver' in window) new MutationObserver(fertig).observe(el, { childList: true }); setTimeout(fertig, 2500);
      }
    };
    var s = document.createElement('script'); s.src = 'https://s.provenexpert.net/seals/proseal-v2.js'; s.async = true;
    s.onload = window.loadProSeal; s.onerror = function () { geladen = false; }; document.head.appendChild(s);
  }
  function kopfEnde() { var h = document.querySelector('main > section, header + section, .hero, section'); return h ? h.getBoundingClientRect().bottom + scrollY : 500; }
  function zeige() { var w = document.querySelector('.vf-siegel'); if (!w) return; w.classList.toggle('ist-da', scrollY > kopfEnde() - 80); }
  addEventListener('scroll', zeige, { passive: true }); addEventListener('load', function () { setTimeout(zeige, 400); }); zeige();
  if (document.readyState === 'complete') setTimeout(init, 300); else addEventListener('load', function () { setTimeout(init, 300); });
  addEventListener('resize', function () { if (innerWidth >= 900) init(); });
})();
