/* La Locanda di Vinadio — locandine ed eventi (dati live dall'API esistente) */
(function () {
  'use strict';

  var homeSlot = document.querySelector('[data-locandine="home"]');
  var allSlot = document.querySelector('[data-locandine="all"]');
  var menuSlot = document.querySelector('[data-locandine="menu"]');
  if (!homeSlot && !allSlot && !menuSlot) return;

  var API = window.LDV_CONFIG.API_BASE + '/locandine';

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var zoomIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';

  function card(loc) {
    return '<button class="poster reveal is-visible" type="button" data-testid="poster-' + loc.id + '" ' +
      'data-img="' + escapeHtml(loc.immagine_url) + '" data-title="' + escapeHtml(loc.titolo) + '" ' +
      (loc.pdf_url ? 'data-pdf="' + escapeHtml(loc.pdf_url) + '" ' : '') +
      'aria-label="' + window.t('ui.enlarge') + ': ' + escapeHtml(loc.titolo) + '">' +
      '<img src="' + escapeHtml(loc.immagine_url) + '" alt="' + escapeHtml(loc.titolo) + '" loading="lazy">' +
      '<span class="poster__body"><span class="poster__title">' + escapeHtml(loc.titolo) + '</span>' +
      '<span class="poster__zoom" aria-hidden="true">' + zoomIcon + '</span></span>' +
      '</button>';
  }

  function bind(slot) {
    slot.querySelectorAll('.poster').forEach(function (el) {
      el.addEventListener('click', function () {
        window.LDV_openLightbox({
          img: el.getAttribute('data-img'),
          title: el.getAttribute('data-title'),
          pdfUrl: el.getAttribute('data-pdf') || null
        });
      });
    });
  }

  fetch(API, { cache:'no-store', credentials:'omit', headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      var list = (json && json.locandine) || [];

      if (homeSlot) {
        var homeList = list.filter(function (l) { return l.mostra_home; });
        var section = homeSlot.closest('section');
        if (!homeList.length) {
          if (section) section.hidden = true;
        } else {
          if (section) section.hidden = false;
          homeSlot.innerHTML = homeList.map(card).join('');
          bind(homeSlot);
        }
      }

      if (menuSlot) {
        var inMenu = list.filter(function (l) { return l.mostra_menu === true; });
        var menuSection = menuSlot.closest('section');
        if (inMenu.length) {
          menuSlot.innerHTML = inMenu.map(card).join('');
          if (menuSection) menuSection.hidden = false;
          bind(menuSlot);
        } else if (menuSection) menuSection.hidden = true;
      }

      if (allSlot) {
        if (!list.length) {
          allSlot.innerHTML = '<div class="state" data-testid="events-empty"><p>' + window.t('eventspage.empty') + '</p></div>';
        } else {
          allSlot.innerHTML = list.map(card).join('');
          bind(allSlot);
        }
      }
    })
    .catch(function () {
      var section = homeSlot && homeSlot.closest('section');
      if (section) section.hidden = true;
      if (menuSlot) { var ms = menuSlot.closest('section'); if (ms) ms.hidden = true; }
      if (allSlot) {
        allSlot.innerHTML = '<div class="state" data-testid="events-empty"><p>' + window.t('eventspage.empty') + '</p></div>';
      }
    });
})();
