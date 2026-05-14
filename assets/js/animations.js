/* VersicherungsFuchs — Animations v1.0
   IntersectionObserver scroll-reveal + utility helpers */

(function(){
  'use strict';

  /* ── 1. SCROLL REVEAL ─────────────────────────────────────────────── */
  var REVEAL_CLASS = 'vf-reveal';
  var VISIBLE_CLASS = 'vf-visible';

  function initScrollReveal(){
    if(!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      document.querySelectorAll('.'+REVEAL_CLASS).forEach(function(el){
        el.classList.add(VISIBLE_CLASS);
      });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add(VISIBLE_CLASS);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.'+REVEAL_CLASS).forEach(function(el){
      io.observe(el);
    });
  }

  /* ── 2. STAGGER CHILDREN ─────────────────────────────────────────── */
  function initStagger(){
    document.querySelectorAll('[data-stagger]').forEach(function(parent){
      var delay = parseInt(parent.getAttribute('data-stagger')) || 80;
      Array.from(parent.children).forEach(function(child, i){
        child.style.transitionDelay = (i * delay) + 'ms';
        child.classList.add(REVEAL_CLASS);
      });
    });
  }

  /* ── 3. ANIMATED NUMBER COUNTER ──────────────────────────────────── */
  function animateCounter(el){
    var target = parseInt(el.getAttribute('data-count')) || 0;
    var duration = parseInt(el.getAttribute('data-duration')) || 1200;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(ease * target).toLocaleString('de-DE');
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters(){
    if(!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          animateCounter(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(function(el){
      io.observe(el);
    });
  }

  /* ── 4. CIRCULAR SCORE PROGRESS ──────────────────────────────────── */
  window.VF = window.VF || {};
  window.VF.animateScore = function(score, containerId){
    var container = document.getElementById(containerId || 'score-circle');
    if(!container) return;
    var circle = container.querySelector('.score-ring-fill');
    var label  = container.querySelector('.score-ring-label');
    if(!circle || !label) return;

    var r = parseFloat(circle.getAttribute('r')) || 42;
    var circ = 2 * Math.PI * r;
    circle.style.strokeDasharray = circ;
    circle.style.strokeDashoffset = circ;

    var target = Math.max(0, Math.min(100, score));
    var duration = 1400;
    var start = null;

    // Color based on score
    var color = score >= 70 ? 'var(--green)' : score >= 45 ? 'var(--yellow)' : 'var(--red)';
    circle.style.stroke = color;

    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      var current = Math.round(ease * target);
      circle.style.strokeDashoffset = circ * (1 - ease * target / 100);
      label.textContent = current;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  /* ── 5. QUESTION SLIDE TRANSITION ───────────────────────────────── */
  window.VF.slideIn = function(el, direction){
    // direction: 'right' (forward) or 'left' (back)
    var from = direction === 'right' ? '30px' : '-30px';
    el.style.opacity = '0';
    el.style.transform = 'translateX(' + from + ')';
    el.style.transition = 'none';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      });
    });
  };

  /* ── 6. AMPEL PULSE ─────────────────────────────────────────────── */
  window.VF.pulseAmpel = function(el){
    if(!el) return;
    el.classList.add('ampel-pulse');
  };

  /* ── 7. MOBILE NAV TOGGLE ────────────────────────────────────────── */
  function initMobileNav(){
    var toggle = document.getElementById('nav-toggle');
    var links  = document.querySelector('.nav-links');
    if(!toggle || !links) return;
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('nav-links-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  /* ── INIT ────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function(){
    initStagger();
    initScrollReveal();
    initCounters();
    initMobileNav();
  });

})();
