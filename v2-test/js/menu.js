/* La Locanda di Vinadio — menù digitale (dati live dall'API esistente) */
(function () {
  'use strict';

  var root = document.getElementById('menu-root');
  var catbarTrack = document.getElementById('catbarTrack');
  if (!root) return;

  var API = window.LDV_CONFIG.API_BASE + '/menu';
  var data = null;

  function lang() { return window.LDV_getLang(); }

  function field(obj, base) {
    return obj[base + '_' + lang()] || obj[base + '_it'] || '';
  }

  function price(cents) {
    if (cents === null || cents === undefined) return '';
    var v = cents / 100;
    return (Number(cents)/100).toLocaleString(lang()==='en'?'en-IE':lang()==='fr'?'fr-FR':lang()==='de'?'de-DE':'it-IT', {style:'currency',currency:'EUR'});
  }

  /* Foto piatto: pronta per quando il gestionale la renderà disponibile.
     Riconosce automaticamente:
     - campi URL: immagine_url / image_url / foto_url / photo_url / immagine / foto / image / photo
       (URL assoluto https://... oppure percorso assoluto /... risolto sul dominio dell'API)
     - flag booleani: has_immagine / has_foto / has_image oppure immagine:true / foto:true
       → usa l'endpoint convenzione locandine: /api/public/menu/{id}/immagine */
  function absolutize(u) {
    if (/^https?:\/\//i.test(u)) return u;
    if (u.charAt(0) === '/') {
      var m = window.LDV_CONFIG.API_BASE.match(/^https?:\/\/[^/]+/);
      return m ? m[0] + u : u;
    }
    return u;
  }

  function photoUrl(item) {
    var keys = ['immagine_url', 'image_url', 'foto_url', 'photo_url', 'immagine', 'foto', 'image', 'photo'];
    for (var i = 0; i < keys.length; i++) {
      var v = item[keys[i]];
      if (typeof v === 'string' && v.trim()) return absolutize(v.trim());
    }
    if (item.has_immagine || item.has_foto || item.has_image || item.immagine === true || item.foto === true) {
      return window.LDV_CONFIG.API_BASE + '/menu/' + item.id + '/immagine';
    }
    return null;
  }

  function showState(kind) {
    if (kind === 'loading') {
      root.innerHTML =
        '<div class="state" data-testid="menu-loading">' +
          '<div class="spinner" aria-hidden="true"></div>' +
          '<p>' + window.t('menu.loading') + '</p>' +
        '</div>';
    } else if (kind === 'error') {
      root.innerHTML =
        '<div class="state" data-testid="menu-error">' +
          '<h3>' + window.t('menu.error.title') + '</h3>' +
          '<p>' + window.t('menu.error.text') + '</p>' +
          '<button class="btn btn--primary" type="button" data-testid="menu-retry-btn" id="menuRetry">' + window.t('menu.retry') + '</button>' +
        '</div>';
      var btn = document.getElementById('menuRetry');
      if (btn) btn.addEventListener('click', load);
    }
    if (catbarTrack) catbarTrack.innerHTML = '';
  }

  function render() {
    if (!data) return;
    var items = data.items || [];
    var cats = [];
    var byCat = {};
    items.forEach(function (item) {
      var cid = item.category_id;
      if (!byCat[cid]) {
        byCat[cid] = { id: cid, name: field(item, 'category'), items: [] };
        cats.push(byCat[cid]);
      }
      byCat[cid].items.push(item);
    });

    /* barra categorie */
    if (catbarTrack) {
      catbarTrack.innerHTML = cats.map(function (c) {
        return '<button class="catbar__pill" type="button" data-testid="menu-cat-' + c.id + '" data-cat="' + c.id + '">' +
          escapeHtml(c.name) + '</button>';
      }).join('');
      catbarTrack.querySelectorAll('.catbar__pill').forEach(function (pill) {
        pill.addEventListener('click', function () {
          var el = document.getElementById('cat-' + pill.getAttribute('data-cat'));
          if (!el) return;
          if (window.LDV_lenis) window.LDV_lenis.scrollTo(el, { offset: -140 });
          else el.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }

    /* sezioni */
    var html = '';
    cats.forEach(function (c) {
      html +=
        '<section class="menu-cat" id="cat-' + c.id + '" data-testid="menu-cat-section-' + c.id + '">' +
          '<div class="menu-cat__head"><h2>' + escapeHtml(c.name) + '</h2>' +
          '<span class="count">' + c.items.length + ' ' + window.t('menu.dishes') + '</span></div>' +
          '<div class="dishes">';
      c.items.forEach(function (item) {
        var name = field(item, 'name');
        var desc = field(item, 'description');
        var img = photoUrl(item);
        var allergens = (item.allergens || []).map(function (a) {
          return { id: Number(a.id), name: field(a, 'name') };
        }).filter(function (a) { return Boolean(a.name); });
        var ingredients = (item.ingredients || []).map(function (i) { return field(i, 'name'); }).filter(Boolean);

        html += '<article class="dish" data-testid="dish-' + item.id + '">';
        html += '<div class="dish__row"><h3 class="dish__name">' + escapeHtml(name) + '</h3>' +
          '<span class="dish__dots" aria-hidden="true"></span>' +
          '<span class="dish__price" data-testid="dish-' + item.id + '-price">' + price(item.price_cents) + '</span></div>';
        if (img) {
          html += '<button class="dish__photo" type="button" data-testid="dish-' + item.id + '-photo" ' +
            'data-lightbox-img="' + escapeAttr(img) + '" data-lightbox-title="' + escapeAttr(name) + '" ' +
            'aria-label="' + window.t('ui.enlarge') + '">' +
            '<img src="' + escapeAttr(img) + '" alt="' + escapeAttr(name) + '" loading="lazy" ' +
            'onerror="this.closest(\'.dish__photo\').style.display=\'none\'"></button>';
        }
        var descriptionToShow = (desc && desc.toLowerCase() !== name.toLowerCase()) ? desc : (!desc ? ingredients.join(', ') : '');
        if (descriptionToShow) {
          html += '<p class="dish__desc">' + escapeHtml(descriptionToShow) + '</p>';
        }
        if (ingredients.length || allergens.length) {
          html += '<div class="dish__tags">';
          allergens.forEach(function (a) {
            var symbol = ALLERGEN_SYMBOLS[a.id] || '⚠️';
            html += '<button class="tag tag--allergen allergen-tooltip-trigger" type="button" ' +
              'data-testid="dish-' + item.id + '-allergen-' + a.id + '" ' +
              'aria-label="' + escapeAttr(a.name + ' — ' + symbol) + '">' +
              escapeHtml(a.name) +
              '<span class="allergen-symbol-tip" role="tooltip" aria-hidden="true">' +
              '<span class="allergen-symbol-tip__icon">' + symbol + '</span>' +
              '<span class="allergen-symbol-tip__name">' + escapeHtml(a.name) + '</span>' +
              '</span>' +
              '</button>';
          });
          html += '</div>';
        }
        html += '</article>';
      });
      html += '</div></section>';
    });

    html +=
      '<div class="menu-notes reveal is-visible">' +
        '<p><strong>*</strong> ' + window.t('menu.note.frozen') + '</p>' +
        '<p>' + window.t('menu.note.allergens') + '</p>' +
      '</div>';

    root.innerHTML = html;
    renderAllergenGuideButtons();

    // Mouse: anteprima automatica; tastiera: Tab; telefono: tocca per mostrare o nascondere.
    root.querySelectorAll('.allergen-tooltip-trigger').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var isOpen = button.classList.contains('is-open');
        root.querySelectorAll('.allergen-tooltip-trigger.is-open').forEach(function (other) {
          other.classList.remove('is-open');
        });
        if (!isOpen) button.classList.add('is-open');
      });
    });

    root.querySelectorAll('[data-lightbox-img]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.LDV_openLightbox({
          img: btn.getAttribute('data-lightbox-img'),
          title: btn.getAttribute('data-lightbox-title')
        });
      });
    });

    /* evidenzia la categoria visibile */
    var sections = root.querySelectorAll('.menu-cat');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && catbarTrack) {
          var id = entry.target.id.replace('cat-', '');
          catbarTrack.querySelectorAll('.catbar__pill').forEach(function (p) {
            p.classList.toggle('is-active', p.getAttribute('data-cat') === id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  /* LEGENDA COMPLETA ALLERGENI — restituita dal database D1, mai hard-coded. */
  var ALLERGEN_SYMBOLS = {
    1: '🌾', 2: '🦐', 3: '🥚', 4: '🐟', 5: '🥜', 6: '🫘', 7: '🥛',
    8: '🌰', 9: '🥬', 10: '🌿', 11: '🌱', 12: '🧪', 13: '🌱', 14: '🦪'
  };
  var ALLERGEN_UI = {
    it: {
      button: 'Lista completa degli allergeni',
      title: 'Guida completa agli allergeni',
      subtitle: 'Consulta tutti gli allergeni presenti nel nostro catalogo.',
      note: 'Per informazioni su allergeni, contaminazione crociata o esigenze alimentari chiedi sempre al personale.',
      close: 'Chiudi',
      lead: 'Consulta la legenda dei 14 allergeni'
    },
    en: {
      button: 'Complete allergen list',
      title: 'Complete allergen guide',
      subtitle: 'View all allergens listed in our catalogue.',
      note: 'For information on allergens, cross-contact or dietary requirements, please ask our staff.',
      close: 'Close',
      lead: 'Explore the 14-allergen guide'
    },
    fr: {
      button: 'Liste complète des allergènes',
      title: 'Guide complet des allergènes',
      subtitle: 'Consultez tous les allergènes de notre catalogue.',
      note: 'Pour toute question sur les allergènes, les contaminations croisées ou vos besoins alimentaires, adressez-vous au personnel.',
      close: 'Fermer',
      lead: 'Consultez les 14 allergènes'
    },
    de: {
      button: 'Vollständige Allergenliste',
      title: 'Vollständiger Allergenleitfaden',
      subtitle: 'Hier finden Sie alle Allergene aus unserem Katalog.',
      note: 'Bei Fragen zu Allergenen, Kreuzkontamination oder besonderen Ernährungsbedürfnissen wenden Sie sich bitte an unser Personal.',
      close: 'Schließen',
      lead: 'Übersicht der 14 Allergene ansehen'
    }
  };
  function allergenStrings() { return ALLERGEN_UI[lang()] || ALLERGEN_UI.it; }
  function guideButton() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'allergen-guide__button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'ldvAllergenGuide');
    button.setAttribute('data-testid', 'complete-allergens-button');
    button.textContent = '✦  ' + allergenStrings().button;
    button.addEventListener('click', openAllergenGuide);
    return button;
  }
  function renderAllergenGuideButtons() {
    if (!Array.isArray(data.allergens) || !data.allergens.length) return;
    var toolbar = document.createElement('div');
    toolbar.className = 'allergen-guide__toolbar';
    var lead = document.createElement('span');
    lead.className = 'allergen-guide__lead';
    lead.textContent = allergenStrings().lead;
    toolbar.append(lead, guideButton());
    root.insertBefore(toolbar, root.firstChild);
    var notes = root.querySelector('.menu-notes');
    if (notes) {
      var last = document.createElement('div');
      last.className = 'allergen-guide__after-notes';
      last.appendChild(guideButton());
      notes.appendChild(last);
    }
  }
  function openAllergenGuide() {
    if (!data || !Array.isArray(data.allergens) || !data.allergens.length) return;
    var copy = allergenStrings();
    var dialog = document.getElementById('ldvAllergenGuide');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'ldvAllergenGuide';
      dialog.className = 'allergen-guide__dialog';
      dialog.setAttribute('aria-labelledby', 'ldvAllergenGuideTitle');
      dialog.setAttribute('aria-modal', 'true');
      dialog.innerHTML = '<div class="allergen-guide__head">' +
          '<h2 id="ldvAllergenGuideTitle"></h2>' +
          '<button type="button" class="allergen-guide__close" data-testid="allergen-guide-close">×</button>' +
        '</div>' +
        '<p class="allergen-guide__subtitle"></p>' +
        '<div class="allergen-guide__grid" data-testid="complete-allergens-grid"></div>' +
        '<p class="allergen-guide__note"></p>';
      document.body.appendChild(dialog);
      dialog.querySelector('.allergen-guide__close').addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    }
    dialog.querySelector('#ldvAllergenGuideTitle').textContent = copy.title;
    dialog.querySelector('.allergen-guide__subtitle').textContent = copy.subtitle;
    dialog.querySelector('.allergen-guide__note').textContent = copy.note;
    dialog.querySelector('.allergen-guide__close').setAttribute('aria-label', copy.close);
    var grid = dialog.querySelector('.allergen-guide__grid');
    grid.replaceChildren();
    var entries = data.allergens.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); });
    entries.forEach(function (a) {
      var item = document.createElement('div');
      item.className = 'allergen-guide__item';
      var symbol = document.createElement('span');
      symbol.className = 'allergen-guide__symbol';
      symbol.textContent = ALLERGEN_SYMBOLS[Number(a.id)] || '⚠️';
      symbol.setAttribute('aria-hidden', 'true');
      var name = document.createElement('span');
      name.className = 'allergen-guide__name';
      name.textContent = field(a, 'name') || '—';
      item.append(symbol, name);
      grid.appendChild(item);
    });
    if (dialog.open) dialog.close();
    dialog.showModal();
    dialog.querySelector('.allergen-guide__close').focus();
  }

  function load() {
    showState('loading');
    fetch(API, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (json) {
        if (!json || !json.ok || !json.items) throw new Error('bad payload');
        data = json;
        render();
      })
      .catch(function () { showState('error'); });
  }

  // Tocco fuori o ESC: chiude eventuali anteprime aperte.
  document.addEventListener('click', function (event) {
    if (event.target.closest('.allergen-tooltip-trigger')) return;
    root.querySelectorAll('.allergen-tooltip-trigger.is-open').forEach(function (button) {
      button.classList.remove('is-open');
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      root.querySelectorAll('.allergen-tooltip-trigger.is-open').forEach(function (button) {
        button.classList.remove('is-open');
        button.blur();
      });
    }
  });

  window.addEventListener('ldv:lang', function () { if (data) render(); });

  load();
})();
