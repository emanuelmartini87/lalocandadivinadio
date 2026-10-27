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
 * MINI PIZZA WOW — HOMEPAGE
 * Solo grafica pubblica: non modifica admin, D1, R2, menu o API.
 * Caricamento soltanto nelle homepage con .hero__eyebrow.
 * Per disattivare: eliminare la sezione MINI PIZZA WOW da questo file.
 * ============================================================= */
(function () {
  'use strict';
  var CSS_ID = 'ldv-mini-pizza-styles';
  var IMG_SRC = 'assets/img/pizza-wow.webp?v=1';

  function start() {
    var eyebrow = document.querySelector('.hero__content .hero__eyebrow');
    var heroContent = document.querySelector('.hero__content');
    if (!eyebrow || !heroContent || document.querySelector('.ldv-mini-pizza')) return;

    var css = `
      .ldv-mini-pizza {
        position: absolute; z-index: 5; width: 66px; height: 66px;
        padding: 0; border: 0; margin: 0; background: transparent;
        appearance: none; cursor: pointer; line-height: 1;
        filter: drop-shadow(0 5px 5px rgba(0,0,0,.34));
        -webkit-tap-highlight-color: transparent;
      }
      .ldv-mini-pizza:focus-visible { outline: 2px solid #ecc875; outline-offset: 5px; border-radius: 50%; }
      .ldv-mini-pizza__float, .ldv-mini-pizza__slow,
      .ldv-mini-pizza__tap { display: block; width: 100%; height: 100%; }
      .ldv-mini-pizza__float { animation: ldvPizzaFloat 4s ease-in-out infinite; }
      .ldv-mini-pizza__slow { animation: ldvPizzaSpin 18s linear infinite; }
      .ldv-mini-pizza__tap.is-burst { animation: ldvPizzaBurst 940ms cubic-bezier(.22,.65,.25,1); }
      .ldv-mini-pizza__photo { display: block; width: 100%; height: 100%; object-fit: contain; }
      .ldv-mini-pizza__steam {
        position:absolute; z-index:6; top:-3px;
        width: 10px; height: 26px; border-radius: 50%;
        pointer-events: none;
        background: linear-gradient(to top, rgba(255,255,255,.04), rgba(255,255,255,.70), transparent);
        filter: blur(3px); opacity:0;
        animation: ldvPizzaSteam 3s ease-out infinite;
      }
      .ldv-mini-pizza__steam--1 { left: 38%; animation-delay:0s; }
      .ldv-mini-pizza__steam--2 { left: 53%; animation-delay:1s; }
      .ldv-mini-pizza__steam--3 { left: 65%; animation-delay:2s; }
      @keyframes ldvPizzaFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
      }
      @keyframes ldvPizzaSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes ldvPizzaBurst {
        from { transform: rotate(0deg) scale(1); }
        45% { transform: rotate(190deg) scale(1.12); }
        to { transform: rotate(360deg) scale(1); }
      }
      @keyframes ldvPizzaSteam {
        0% { transform: translate(-50%, 13px) scale(.55); opacity:0; }
        27% { opacity:.37; }
        75% { opacity:.14; }
        100% { transform: translate(-35%, -22px) scale(1.3); opacity:0; }
      }
      @media (max-width: 680px) {
        .ldv-mini-pizza { width: 56px; height: 56px; }
        .ldv-mini-pizza__steam { height:20px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ldv-mini-pizza__float, .ldv-mini-pizza__slow, .ldv-mini-pizza__tap {
          animation: none !important;
        }
        .ldv-mini-pizza__steam { display: none; }
      }
    `;
    if (!document.getElementById(CSS_ID)) {
      var style = document.createElement('style');
      style.id = CSS_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }

    // Pizza separata dalla riga: i cambi lingua non la cancellano
    // e il testo esistente non viene spostato o modificato.
    var pizza = document.createElement('button');
    pizza.type = 'button';
    pizza.className = 'ldv-mini-pizza';
    pizza.title = 'Pizza appena sfornata: tocca per farla girare!';
    pizza.setAttribute('aria-label', 'Fai girare la pizza');
    pizza.innerHTML =
      '<span class="ldv-mini-pizza__float">' +
        '<span class="ldv-mini-pizza__slow">' +
          '<span class="ldv-mini-pizza__tap">' +
            '<img class="ldv-mini-pizza__photo" alt="" draggable="false" src="' + IMG_SRC + '">' +
          '</span>' +
        '</span>' +
      '</span>' +
      '<span class="ldv-mini-pizza__steam ldv-mini-pizza__steam--1" aria-hidden="true"></span>' +
      '<span class="ldv-mini-pizza__steam ldv-mini-pizza__steam--2" aria-hidden="true"></span>' +
      '<span class="ldv-mini-pizza__steam ldv-mini-pizza__steam--3" aria-hidden="true"></span>';
    heroContent.appendChild(pizza);

    var tap = pizza.querySelector('.ldv-mini-pizza__tap');
    tap.addEventListener('animationend', function () { tap.classList.remove('is-burst'); });
    pizza.addEventListener('click', function () {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      tap.classList.remove('is-burst');
      void tap.offsetWidth;  // Permette di ripetere l'animazione al tocco.
      tap.classList.add('is-burst');
    });

    function placePizza() {
      if (!pizza.isConnected) return;
      // Rileviamo la posizione effettiva dell'ultima località (Cuneo / traduzioni)
      // senza modificare il testo già gestito dal sistema multilingua.
      var node = Array.prototype.find.call(eyebrow.childNodes, function (child) {
        return child.nodeType === Node.TEXT_NODE && child.textContent.trim();
      });
      if (!node) return;
      var content = node.textContent || '';
      var start = content.lastIndexOf('·') + 1;
      while (start < content.length && /\s/.test(content[start])) start++;
      var end = content.length;
      while (end > start && /\s/.test(content[end - 1])) end--;
      if (end <= start) return;
      var range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      var lastWord = range.getBoundingClientRect();
      var container = heroContent.getBoundingClientRect();
      var size = pizza.getBoundingClientRect().width;
      // Mettiamo la pizza sopra il centro della parola "Cuneo", con 9 px di margine.
      var x = lastWord.left + lastWord.width / 2 - container.left - size / 2;
      var y = lastWord.top - container.top - size - 9;
      pizza.style.left = Math.round(x) + 'px';
      pizza.style.top = Math.round(y) + 'px';
    }

    // Ricalcolo con font caricati, resizing e cambi della traduzione.
    placePizza();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePizza);
    window.addEventListener('resize', placePizza, { passive:true });
    var observer = new MutationObserver(placePizza);
    observer.observe(eyebrow, {childList:true, characterData:true, subtree:true});
    window.addEventListener('load', placePizza, { once:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
