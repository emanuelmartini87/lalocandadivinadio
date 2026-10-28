/* La Locanda di Vinadio — script principale */
(function () {
  'use strict';

  var site = window.LDV_SITE || {};
  var LANGS = ['it', 'en', 'fr', 'de'];
  var CONFIG = {
    API_BASE: 'https://locanda-menu-public.emanuel-martini87.workers.dev/api/public',
    PHONE_DISPLAY: site.phoneDisplay || '0171 959506',
    PHONE_TEL: site.phoneHref || '+390171959506',
    EMAIL: site.email || '',
    MAPS_URL: site.maps || 'https://www.google.com/maps/search/?api=1&query=La+Locanda+di+Vinadio+Via+Roma+16+Vinadio',
    MAPS_EMBED: site.mapsEmbed || 'https://www.google.com/maps?q=La+Locanda+di+Vinadio,+Via+Roma+16,+12010+Vinadio+CN&output=embed'
  };
  window.LDV_CONFIG = CONFIG;

  function normalizedLang(value) {
    var lang = String(value || '').toLowerCase().trim();
    return LANGS.indexOf(lang) !== -1 ? lang : null;
  }

  function getLang() {
    var query = new URLSearchParams(window.location.search).get('lang');
    if (normalizedLang(query)) return normalizedLang(query);
    var pageDefault = document.body && document.body.getAttribute('data-default-lang');
    if (normalizedLang(pageDefault)) return normalizedLang(pageDefault);
    var saved = null;
    try { saved = window.localStorage.getItem('ldv-lang'); } catch (e) { /* Storage bloccato */ }
    if (normalizedLang(saved)) return normalizedLang(saved);
    return normalizedLang((navigator.language || 'it').slice(0, 2)) || 'it';
  }

  function t(key) {
    var dictionaries = window.LDV_I18N || {};
    var current = dictionaries[getLang()] || {};
    var fallback = dictionaries.it || {};
    return current[key] != null ? current[key] : (fallback[key] != null ? fallback[key] : key);
  }
  window.t = t;
  window.LDV_getLang = getLang;

  function applyI18n() {
    var lang = getLang();
    var dictionaries = window.LDV_I18N || {};
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    // Usare data-i18n-html solo con traduzioni HTML fidate, definite nel progetto.
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    var page = document.body && document.body.getAttribute('data-page');
    var titleKey = 'meta.title.' + page;
    if (page && dictionaries[lang] && dictionaries[lang][titleKey]) document.title = t(titleKey);
    document.querySelectorAll('.lang-switch button[data-lang]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    if (lightbox && lightbox.classList.contains('is-open')) {
      lightbox.querySelector('.lightbox__close').setAttribute('aria-label', t('ui.close'));
      var pdfButton = lightbox.querySelector('.lightbox__pdf');
      if (!pdfButton.hidden) pdfButton.textContent = t('eventspage.pdf');
    }
  }
  window.LDV_applyI18n = applyI18n;

  function setLang(lang) {
    lang = normalizedLang(lang);
    if (!lang) return;
    try { window.localStorage.setItem('ldv-lang', lang); } catch (e) { /* Storage bloccato */ }
    // L'URL resta sincronizzato quando contiene gia' il parametro lang.
    var url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    document.body.setAttribute('data-default-lang', lang);
    applyI18n();
    window.dispatchEvent(new CustomEvent('ldv:lang', { detail: { lang: lang } }));
  }
  window.LDV_setLang = setLang;

  document.querySelectorAll('.lang-switch button[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
  });

  /* ---------- Navigazione ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    if (nav.classList.contains('on-hero')) {
      var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } else {
      nav.classList.add('is-scrolled');
    }
  }

  var burger = document.querySelector('.nav__burger');
  var mobileMenu = document.querySelector('.mobile-menu');
  var menuOpen = false;
  var overflowBeforeMenu = '';
  function toggleMobileMenu(open) {
    if (!burger || !mobileMenu) return;
    if (open && !menuOpen) overflowBeforeMenu = document.body.style.overflow;
    menuOpen = Boolean(open);
    mobileMenu.classList.toggle('is-open', menuOpen);
    burger.setAttribute('aria-expanded', String(menuOpen));
    document.body.style.overflow = menuOpen ? 'hidden' : overflowBeforeMenu;
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () { toggleMobileMenu(!menuOpen); });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleMobileMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { toggleMobileMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (menuOpen && window.innerWidth > 1024) toggleMobileMenu(false);
    });
  }

  /* ---------- Scorrimento ---------- */
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;
  if (!reducedMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    function raf(time) { lenis.raf(time); window.requestAnimationFrame(raf); }
    window.requestAnimationFrame(raf);
    window.LDV_lenis = lenis;
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      if (menuOpen) toggleMobileMenu(false);
      if (lenis) lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + id);
      }
    });
  });

  /* ---------- Animazioni reveal ---------- */
  var revealItems = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(function (el) {
      var delay = Number(el.getAttribute('data-delay'));
      if (Number.isFinite(delay) && delay > 0) el.style.transitionDelay = Math.min(delay, 2000) + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Parallax hero ---------- */
  var heroBg = document.querySelector('[data-parallax]');
  if (heroBg && !reducedMotion) {
    var parallaxPending = false;
    function updateParallax() {
      parallaxPending = false;
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) heroBg.style.transform = 'translate3d(0,' + (y * 0.28) + 'px,0)';
    }
    window.addEventListener('scroll', function () {
      if (!parallaxPending) { parallaxPending = true; window.requestAnimationFrame(updateParallax); }
    }, { passive: true });
  }

  /* ---------- Marquee ---------- */
  document.querySelectorAll('.marquee__track').forEach(function (track) {
    if (track.dataset.ldvDuplicated === 'true') return;
    // Il clone e' decorativo e non deve duplicare link nel tab order.
    var items = Array.from(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(function (interactive) {
        interactive.setAttribute('tabindex', '-1');
      });
      if (clone.matches('a, button, input, select, textarea, [tabindex]')) clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });
    track.dataset.ldvDuplicated = 'true';
  });

  /* ---------- Lightbox globale ---------- */
  var lightbox = null;
  var previousFocus = null;
  var overflowBeforeLightbox = '';
  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = overflowBeforeLightbox;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }
  function buildLightbox() {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Galleria');
    lightbox.innerHTML =
      '<button class="lightbox__close" type="button" data-testid="lightbox-close">&times;</button>' +
      '<figure class="lightbox__figure">' +
        '<img class="lightbox__img" alt="">' +
        '<figcaption class="lightbox__caption">' +
          '<span class="lightbox__title"></span>' +
          '<a class="btn btn--gold lightbox__pdf" data-testid="lightbox-pdf" target="_blank" rel="noopener noreferrer" hidden></a>' +
        '</figcaption>' +
      '</figure>';
    document.body.appendChild(lightbox);
    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      if (e.key === 'Tab') {
        var available = Array.from(lightbox.querySelectorAll('button:not([hidden]), a:not([hidden])'));
        if (!available.length) return;
        var first = available[0], last = available[available.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  window.LDV_openLightbox = function (opts) {
    opts = opts || {};
    if (!opts.img) return;
    if (!lightbox) buildLightbox();
    previousFocus = document.activeElement;
    overflowBeforeLightbox = document.body.style.overflow;
    var img = lightbox.querySelector('.lightbox__img');
    img.src = opts.img;
    img.alt = opts.title || '';
    lightbox.querySelector('.lightbox__title').textContent = opts.title || '';
    var pdfBtn = lightbox.querySelector('.lightbox__pdf');
    pdfBtn.hidden = !opts.pdfUrl;
    if (opts.pdfUrl) { pdfBtn.href = opts.pdfUrl; pdfBtn.textContent = t('eventspage.pdf'); }
    else pdfBtn.removeAttribute('href');
    lightbox.querySelector('.lightbox__close').setAttribute('aria-label', t('ui.close'));
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox__close').focus();
  };
  window.LDV_closeLightbox = closeLightbox;

  /* ---------- Footer e contatti ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-email-row]').forEach(function (row) {
    row.hidden = !CONFIG.EMAIL;
    if (!CONFIG.EMAIL) return;
    var link = row.querySelector('a');
    if (link) { link.href = 'mailto:' + CONFIG.EMAIL; link.textContent = CONFIG.EMAIL; }
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    if (CONFIG.PHONE_TEL) a.href = 'tel:' + CONFIG.PHONE_TEL;
    if (CONFIG.PHONE_DISPLAY && /0171\s*959506/.test(a.textContent)) a.textContent = CONFIG.PHONE_DISPLAY;
  });
  var links = { facebook: site.facebook, instagram: site.instagram, review: site.review, maps: CONFIG.MAPS_URL };
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var key = a.getAttribute('data-link');
    if (links[key]) a.href = links[key];
  });

  applyI18n();
})();
