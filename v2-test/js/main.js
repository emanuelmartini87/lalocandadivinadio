/* La Locanda di Vinadio — script principale */
(function () {
  'use strict';

  var CONFIG = {
    API_BASE: 'https://locanda-menu-public.emanuel-martini87.workers.dev/api/public',
    PHONE_DISPLAY: (window.LDV_SITE||{}).phoneDisplay || '0171 959506',
    PHONE_TEL: (window.LDV_SITE||{}).phoneHref || '+390171959506',
    EMAIL: '', /* facoltativa: inserire qui l'email per mostrarla nel sito */
    MAPS_URL: (window.LDV_SITE||{}).maps || 'https://www.google.com/maps/search/?api=1&query=La+Locanda+di+Vinadio+Via+Roma+16+Vinadio',
    MAPS_EMBED: 'https://www.google.com/maps?q=La+Locanda+di+Vinadio,+Via+Roma+16,+12010+Vinadio+CN&output=embed'
  };
  window.LDV_CONFIG = CONFIG;

  /* ---------- Lingua ---------- */
  var LANGS = ['it', 'en', 'fr', 'de'];

  function getLang() {
    var query = new URLSearchParams(window.location.search).get('lang');
    if (query && LANGS.indexOf(query.toLowerCase()) !== -1) return query.toLowerCase();
    var pageDefault = document.body && document.body.getAttribute('data-default-lang');
    if (pageDefault && LANGS.indexOf(pageDefault) !== -1) return pageDefault;
    var saved = null;
    try { saved = localStorage.getItem('ldv-lang'); } catch (e) {}
    if (saved && LANGS.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || 'it').slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) !== -1 ? nav : 'it';
  }

  function t(key) {
    var lang = getLang();
    var dict = window.LDV_I18N[lang] || window.LDV_I18N.it;
    return dict[key] || window.LDV_I18N.it[key] || key;
  }
  window.t = t;
  window.LDV_getLang = getLang;

  function applyI18n() {
    var lang = getLang();
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    var page = document.body.getAttribute('data-page');
    var titleKey = 'meta.title.' + page;
    if (window.LDV_I18N[lang] && window.LDV_I18N[lang][titleKey]) {
      document.title = t(titleKey);
    }
    document.querySelectorAll('.lang-switch button').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  window.LDV_applyI18n = applyI18n;

  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    try { localStorage.setItem('ldv-lang', lang); } catch (e) {}
    var p = new URL(window.location.href);
    if (p.searchParams.has('lang')) { p.searchParams.set('lang', lang); history.replaceState(null, '', p.pathname + p.search + p.hash); }
    document.body.setAttribute('data-default-lang',lang);
    applyI18n();
    window.dispatchEvent(new CustomEvent('ldv:lang', { detail: { lang: lang } }));
  }

  document.querySelectorAll('.lang-switch button').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
  });

  /* ---------- Navigazione ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    if (nav.classList.contains('on-hero')) {
      var onScroll = function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 40);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } else {
      nav.classList.add('is-scrolled');
    }
  }

  var burger = document.querySelector('.nav__burger');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.LDV_lenis = lenis;
  }

  /* anchor interni con lenis */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) { lenis.scrollTo(el, { offset: -90 }); }
      else { el.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) {
    var d = el.getAttribute('data-delay');
    if (d) el.style.transitionDelay = d + 'ms';
    io.observe(el);
  });

  /* ---------- Parallax hero ---------- */
  var heroBg = document.querySelector('[data-parallax]');
  if (heroBg && !reduced) {
    var tick = function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        heroBg.style.transform = 'translateY(' + y * 0.28 + 'px)';
      }
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(tick); }, { passive: true });
  }

  /* ---------- Marquee: duplica il contenuto per il loop ---------- */
  document.querySelectorAll('.marquee__track').forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ---------- Lightbox globale ---------- */
  var lightbox = null;
  function buildLightbox() {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML =
      '<button class="lightbox__close" type="button" data-testid="lightbox-close" aria-label="' + t('ui.close') + '">&times;</button>' +
      '<figure class="lightbox__figure">' +
        '<img class="lightbox__img" alt="">' +
        '<figcaption class="lightbox__caption">' +
          '<span class="lightbox__title"></span>' +
          '<a class="btn btn--gold lightbox__pdf" data-testid="lightbox-pdf" target="_blank" rel="noopener noreferrer" hidden></a>' +
        '</figcaption>' +
      '</figure>';
    document.body.appendChild(lightbox);
    var close = function () { closeLightbox(); };
    lightbox.querySelector('.lightbox__close').addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
    });
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  window.LDV_openLightbox = function (opts) {
    if (!lightbox) buildLightbox();
    var img = lightbox.querySelector('.lightbox__img');
    img.src = opts.img;
    img.alt = opts.title || '';
    lightbox.querySelector('.lightbox__title').textContent = opts.title || '';
    var pdfBtn = lightbox.querySelector('.lightbox__pdf');
    if (opts.pdfUrl) {
      pdfBtn.hidden = false;
      pdfBtn.href = opts.pdfUrl;
      pdfBtn.textContent = t('eventspage.pdf');
    } else {
      pdfBtn.hidden = true;
    }
    lightbox.querySelector('.lightbox__close').setAttribute('aria-label', t('ui.close'));
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  /* ---------- Footer ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Email facoltativa ---------- */
  if (CONFIG.EMAIL) {
    document.querySelectorAll('[data-email-row]').forEach(function (row) {
      row.hidden = false;
      var a = row.querySelector('a');
      if (a) { a.href = 'mailto:' + CONFIG.EMAIL; a.textContent = CONFIG.EMAIL; }
    });
  }

  /* Contatti e link gestibili in un unico file js/site-config.js */
  var site = window.LDV_SITE || {};
  document.querySelectorAll('a[href^="tel:"]').forEach(function(a) {
    if(site.phoneHref) a.href = 'tel:' + site.phoneHref;
    if(site.phoneDisplay && /0171\s*959506/.test(a.textContent)) a.textContent = site.phoneDisplay;
  });
  document.querySelectorAll('[data-link="facebook"]').forEach(function(a){if(site.facebook) a.href=site.facebook;});
  document.querySelectorAll('[data-link="instagram"]').forEach(function(a){if(site.instagram) a.href=site.instagram;});
  document.querySelectorAll('[data-link="review"]').forEach(function(a){if(site.review) a.href=site.review;});
  document.querySelectorAll('[data-link="maps"]').forEach(function(a){if(site.maps) a.href=site.maps;});
  applyI18n();
})();
