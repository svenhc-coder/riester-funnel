/* VersicherungsFuchs — Funnel Fox v1.0
   Verspielte, aufbauende Build-up-Animation + Fuchs-Begleiter für den Riester-Check.
   ADDITIV: ändert keine Funnel-Logik (Auswahl/Navigation/State bleiben unberührt).
   GPU-only (transform/opacity). Respektiert prefers-reduced-motion. Tilt nur auf Desktop. */
(function () {
  'use strict';
  window.VF = window.VF || {};

  var mq = window.matchMedia ? window.matchMedia.bind(window) : function(){return{matches:false};};
  var REDUCE = mq('(prefers-reduced-motion: reduce)').matches;
  var COARSE = mq('(pointer: coarse)').matches; // Touch/Mobile → kein Tilt

  /* Kompakter, geometrischer Fuchskopf (Brand-Orange) — passt zur Pattern-C-Marke */
  var FOX_SVG =
    '<svg viewBox="0 0 64 64" width="46" height="46" fill="none" aria-hidden="true">' +
    '<path d="M10 12 L24 26 L14 30 Z" fill="#ff7a00"/>' +              // linkes Ohr
    '<path d="M54 12 L40 26 L50 30 Z" fill="#ff7a00"/>' +              // rechtes Ohr
    '<path d="M12 26 Q32 18 52 26 L44 44 Q32 54 20 44 Z" fill="#ff7a00"/>' + // Kopf
    '<path d="M20 44 Q32 54 44 44 L38 48 Q32 52 26 48 Z" fill="#fff" opacity=".92"/>' + // Wange/Schnauze hell
    '<circle cx="25" cy="34" r="2.6" fill="#0c0c0c" class="ff-eye"/>' +
    '<circle cx="39" cy="34" r="2.6" fill="#0c0c0c" class="ff-eye"/>' +
    '<path d="M30 45 L34 45 L32 48 Z" fill="#0c0c0c"/>' +              // Nase
    '</svg>';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function injectFox() {
    if (document.getElementById('ff-fox')) return document.getElementById('ff-fox');
    var wrap = el('div', 'ff-fox'); wrap.id = 'ff-fox'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<span class="ff-bubble" id="ff-bubble"></span>' +
                     '<span class="ff-fox-mark">' + FOX_SVG + '</span>';
    document.body.appendChild(wrap);
    return wrap;
  }

  var BUBBLES = ['Stark!', 'Top gemerkt!', 'Weiter so 🦊', 'Notiert!', 'Guter Schritt!'];
  var bubbleIdx = 0;

  function foxReact(msg) {
    var fox = document.getElementById('ff-fox'); if (!fox) return;
    if (!REDUCE) { fox.classList.remove('ff-bounce'); void fox.offsetWidth; fox.classList.add('ff-bounce'); }
    if (msg) {
      var b = document.getElementById('ff-bubble');
      if (b) {
        b.textContent = msg; b.classList.add('ff-bubble-show');
        clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('ff-bubble-show'); }, 1700);
      }
    }
  }
  VF.foxReact = foxReact;

  /* Aufbauender Build-up: Frage-Nr → Frage → Hinweis → Optionen (gestaffelt) → Button */
  VF.funnelBuildIn = function (body /*, dir */) {
    injectFox();
    var num  = body.querySelector('.funnel-question-num');
    var q    = body.querySelector('.funnel-question');
    var hint = body.querySelector('.funnel-hint');
    var opts = Array.prototype.slice.call(body.querySelectorAll('.funnel-option'));
    var next = body.querySelector('.funnel-next');
    var seq  = [num, q, hint].concat(opts).concat([next]).filter(Boolean);

    if (REDUCE) { wireTiltAndSelect(opts); positionPaw(); return; } // keine Motion

    seq.forEach(function (e) { e.style.opacity = '0'; e.style.transform = 'translateY(16px)'; e.style.transition = 'none'; });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      seq.forEach(function (e, i) {
        var d = i * 70;
        e.style.transition = 'opacity .40s cubic-bezier(.16,1,.3,1) ' + d + 'ms, transform .55s cubic-bezier(.34,1.56,.64,1) ' + d + 'ms';
        e.style.opacity = ''; e.style.transform = '';
      });
    }); });
    foxReact(); // Fuchs hüpft bei jeder neuen Frage
    wireTiltAndSelect(opts);
    positionPaw();
  };

  /* 3D-Tilt der Optionskarten (nur Desktop) + befriedigender Auswahl-Pop + Fuchs-Reaktion */
  function wireTiltAndSelect(opts) {
    opts.forEach(function (card) {
      if (!COARSE && !REDUCE) {
        card.addEventListener('pointermove', function (ev) {
          if (card.classList.contains('ff-popping')) return;
          var r = card.getBoundingClientRect();
          var x = (ev.clientX - r.left) / r.width - 0.5;
          var y = (ev.clientY - r.top) / r.height - 0.5;
          card.style.transform = 'perspective(680px) rotateX(' + (-y * 4.5) + 'deg) rotateY(' + (x * 7) + 'deg) translateZ(2px)';
        });
        card.addEventListener('pointerleave', function () { card.style.transform = ''; });
      }
      card.addEventListener('click', function () {
        if (!REDUCE) {
          card.classList.add('ff-popping');
          card.classList.remove('ff-pop'); void card.offsetWidth; card.classList.add('ff-pop');
          setTimeout(function () { card.classList.remove('ff-popping'); card.style.transform = ''; }, 360);
        }
        foxReact(BUBBLES[bubbleIdx++ % BUBBLES.length]);
        positionPaw();
      });
    });
  }

  /* Fortschritt als Reise: kleine Pfote/Fuchs am Ende des Fortschrittsbalkens */
  function positionPaw() {
    var fill = document.getElementById('prog-fill'); if (!fill) return;
    var bar = fill.parentElement; if (!bar) return;
    bar.style.position = bar.style.position || 'relative';
    var paw = document.getElementById('ff-paw');
    if (!paw) { paw = el('span', 'ff-paw'); paw.id = 'ff-paw'; paw.setAttribute('aria-hidden', 'true'); paw.textContent = '🐾'; bar.appendChild(paw); }
    requestAnimationFrame(function () { paw.style.left = (fill.style.width || '0%'); });
  }

  /* Letzter Schritt: kleine Belohnung, wenn der Ergebnis-Button erscheint */
  function maybeCelebrate() {
    var next = document.querySelector('.funnel-next'); if (!next) return;
    if (/Ergebnis/i.test(next.textContent || '')) {
      next.classList.add('ff-glow');
      foxReact('Geschafft! 🎉');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Falls die Seite slideIn statt funnelBuildIn nutzt: Fuchs trotzdem einblenden + Paw setzen.
    setTimeout(function () { injectFox(); positionPaw(); maybeCelebrate(); }, 60);
  });
})();
