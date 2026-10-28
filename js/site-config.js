/* LA LOCANDA DI VINADIO — DATI PERSONALIZZABILI (V2)
 * Modifica qui i riferimenti ufficiali. Non contiene password o dati privati.
 * Le foto sono in assets/img/ — sostituire file mantenendo nomi e formato.
 */
window.LDV_SITE = Object.freeze({
  phoneDisplay: '0171 959506',
  phoneHref: '+390171959506',
  address: 'Via Roma, 16 — 12010 Vinadio (CN)',
  facebook: 'https://www.facebook.com/p/La-locanda-di-Vinadio-100036786831516/',
  instagram: 'https://www.instagram.com/la.locanda.di.vinadio/',
  review: 'https://search.google.com/local/writereview?placeid=ChIJp29qBV4DzRIRqR4vtSZ9P5E',
  maps: 'https://www.google.com/maps/search/?api=1&query=La+Locanda+di+Vinadio+Via+Roma+16+Vinadio'
});

/* =============================================================
 * MINI PIZZA WOW — PATCH MOBILE + ANIMAZIONE V2
 * Non cambia menu, admin, locandine, HTML, CSS del sito o API.
 * L'immagine rimane /assets/img/pizza-wow.webp.
 * ============================================================= */
(function () {
  'use strict';
  var STYLE_ID = 'ldv-mini-pizza-styles';
  var SOURCE = 'assets/img/pizza-wow.webp?v=2';
  var raf = 0;

  function init() {
    var eyebrow = document.querySelector('.hero__content .hero__eyebrow');
    var parent = document.querySelector('.hero__content');
    if (!eyebrow || !parent || document.querySelector('.ldv-mini-pizza')) return;

    var css = `
      .ldv-mini-pizza {
        position: absolute; z-index: 8; width: 68px; height: 68px;
        box-sizing: border-box; padding: 0; border: 0; margin: 0;
        background: transparent; appearance: none; line-height: 1;
        cursor: pointer; visibility: hidden; touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        filter: drop-shadow(0 5px 6px rgba(0, 0, 0, .38));
      }
      .ldv-mini-pizza.is-positioned { visibility: visible; }
      .ldv-mini-pizza:focus-visible {
        outline: 2px solid #f5d59b; outline-offset: 4px; border-radius: 50%;
      }
      .ldv-mini-pizza__float,
      .ldv-mini-pizza__spin {
        display: block; width: 100%; height: 100%;
        transform-origin: 50% 50%;
      }
      .ldv-mini-pizza__float { animation: ldvPizzaFloat 3.4s ease-in-out infinite; }
      .ldv-mini-pizza__spin { animation: ldvPizzaRotate 12s linear infinite; }
      .ldv-mini-pizza__photo {
        display: block; width: 100%; height: 100%; object-fit: contain;
        transform-origin: center center; user-select: none;
      }
      .ldv-mini-pizza.is-tapped .ldv-mini-pizza__photo {
        animation: ldvPizzaTap .85s cubic-bezier(.2,.75,.25,1) 1;
      }
      /* Vapore visibile: tre sottili tratti sopra la pizza, SVG integrato. */
      .ldv-mini-pizza__steam {
        position: absolute; left: 5%; top: -35px; width: 90%; height: 43px;
        overflow: visible; pointer-events: none;
        filter: drop-shadow(0 0 2px rgba(255,255,255,.25));
      }
      .ldv-mini-pizza__steam path {
        fill: none; stroke: rgba(255, 247, 226, .94);
        stroke-width: 2.8; stroke-linecap: round;
        animation: ldvPizzaSteam 3.15s ease-out infinite;
        transform-origin: bottom center;
      }
      .ldv-mini-pizza__steam path:nth-child(2) { animation-delay: 1.05s; }
      .ldv-mini-pizza__steam path:nth-child(3) { animation-delay: 2.1s; }
      @keyframes ldvPizzaRotate { to { transform: rotate(360deg); } }
      @keyframes ldvPizzaFloat {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @keyframes ldvPizzaTap {
        0% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.13) rotate(200deg); }
        100% { transform: scale(1) rotate(360deg); }
      }
      @keyframes ldvPizzaSteam {
        0% { opacity: 0; transform: translateY(6px) scale(.82); }
        25% { opacity: .72; }
        70% { opacity: .38; }
        100% { opacity: 0; transform: translateY(-16px) scale(1.12); }
      }
      @media (max-width: 680px) {
        .ldv-mini-pizza { width: 56px; height: 56px; }
        .ldv-mini-pizza__steam { top: -31px; height: 38px; }
      }
      /* Rispetta l'impostazione di sistema per la riduzione del movimento. */
      @media (prefers-reduced-motion: reduce) {
        .ldv-mini-pizza__float, .ldv-mini-pizza__spin {
          animation: none !important;
        }
        .ldv-mini-pizza__steam { display: none !important; }
        /* Un tocco esplicito consente un singolo giro, senza loop. */
        .ldv-mini-pizza.is-tapped .ldv-mini-pizza__photo {
          animation: ldvPizzaTap .85s ease 1 !important;
        }
      }
    `;
    if (!document.getElementById(STYLE_ID)) {
      var el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = css;
      document.head.appendChild(el);
    }

    var pizza = document.createElement('button');
    pizza.type = 'button';
    pizza.className = 'ldv-mini-pizza';
    pizza.title = 'Pizza appena sfornata — tocca per farla girare';
    pizza.setAttribute('aria-label', 'Fai girare la pizza');
    pizza.innerHTML =
      '<span class="ldv-mini-pizza__float">' +
        '<span class="ldv-mini-pizza__spin">' +
          '<img class="ldv-mini-pizza__photo" alt="" draggable="false" src="' + SOURCE + '">' +
        '</span>' +
      '</span>' +
      '<svg class="ldv-mini-pizza__steam" viewBox="0 0 68 45" aria-hidden="true" focusable="false">' +
        '<path d="M20 40 Q8 30 20 19 Q30 10 18 4"/>' +
        '<path d="M34 40 Q46 29 33 20 Q24 11 35 3"/>' +
        '<path d="M49 40 Q39 29 51 19 Q60 10 48 4"/>' +
      '</svg>';
    parent.appendChild(pizza);

    var photo = pizza.querySelector('.ldv-mini-pizza__photo');
    photo.addEventListener('error', function () {
      pizza.classList.remove('is-positioned');
      console.warn('Foto pizza non trovata:', SOURCE);
    });
    photo.addEventListener('load', schedulePosition);
    photo.addEventListener('animationend', function () {
      pizza.classList.remove('is-tapped');
    });
    pizza.addEventListener('click', function () {
      pizza.classList.remove('is-tapped');
      void photo.offsetWidth;
      pizza.classList.add('is-tapped');
    });

    // Misura l'ultima località; sul telefono resta sempre dentro lo schermo.
    // Non sposta né modifica la riga di testo, anche nelle quattro lingue.
    function position() {
      raf = 0;
      if (!pizza.isConnected) return;
      var nodes = Array.prototype.filter.call(eyebrow.childNodes, function (node) {
        return node.nodeType === 3 && node.textContent.trim().length;
      });
      if (!nodes.length) return;
      var node = nodes[nodes.length - 1];
      var value = node.textContent;
      var start = value.lastIndexOf('·') + 1;
      while (start < value.length && /\s/.test(value[start])) start++;
      var end = value.length;
      while (end > start && /\s/.test(value[end - 1])) end--;
      if (start === end) return;
      var range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      var word = range.getBoundingClientRect();
      var area = parent.getBoundingClientRect();
      var pageWidth = document.documentElement.clientWidth || window.innerWidth;
      var size = pizza.offsetWidth;
      if (!word.width || !area.width || !size) return;
      var wantedCenter = word.left + word.width / 2;
      var center = Math.max(size / 2 + 12,
        Math.min(pageWidth - size / 2 - 12, wantedCenter));
      pizza.style.left = Math.round(center - size / 2 - area.left) + 'px';
      pizza.style.top = Math.round(word.top - size - 13 - area.top) + 'px';
      pizza.classList.add('is-positioned');
    }
    function schedulePosition() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(position);
    }
    schedulePosition();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(schedulePosition);
    }
    window.addEventListener('load', schedulePosition);
    window.addEventListener('resize', schedulePosition, {passive:true});
    window.addEventListener('orientationchange', schedulePosition);
    window.addEventListener('pageshow', schedulePosition);
    var observer = new MutationObserver(schedulePosition);
    observer.observe(eyebrow, {childList:true, characterData:true, subtree:true});
    // Riposizionamento dopo la breve animazione d'entrata del titolo.
    setTimeout(schedulePosition, 1100);
    setTimeout(schedulePosition, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
