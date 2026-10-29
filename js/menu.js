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

  var NOTICE_FALLBACK = {
    it: 'Menù temporaneamente non disponibile. Ti invitiamo a riprovare più tardi.',
    en: 'Menu temporarily unavailable. Please try again later.',
    fr: 'Carte temporairement indisponible. Veuillez réessayer plus tard.',
    de: 'Speisekarte vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.'
  };

  function setMenuSuspended(isSuspended) {
    document.body.classList.toggle('ldv-menu-suspended', isSuspended);
    var catbar = document.querySelector('.catbar');
    if (catbar) catbar.hidden = isSuspended;
    if (isSuspended && catbarTrack) catbarTrack.textContent = '';
  }

  function renderSuspended() {
    setMenuSuspended(true);
    root.replaceChildren();
    var box = document.createElement('section');
    box.className = 'menu-suspended';
    box.setAttribute('role', 'status');
    box.setAttribute('data-testid', 'menu-temporarily-unavailable');
    var icon = document.createElement('div');
    icon.className = 'menu-suspended__symbol';
    icon.textContent = '✦';
    icon.setAttribute('aria-hidden', 'true');
    var title = document.createElement('h2');
    title.textContent = {it:'Menù sospeso', en:'Menu unavailable', fr:'Carte indisponible', de:'Speisekarte nicht verfügbar'}[lang()] || 'Menù sospeso';
    var desc = document.createElement('p');
    desc.textContent = data['notice_' + lang()] || data.notice_it || NOTICE_FALLBACK[lang()] || NOTICE_FALLBACK.it;
    box.append(icon,title,desc);
    root.appendChild(box);
    if (!document.getElementById('ldv-menu-suspended-style')) {
      var style = document.createElement('style');
      style.id = 'ldv-menu-suspended-style';
      style.textContent =
        '.menu-suspended{max-width:800px;margin:2.5rem auto 1rem;padding:3rem 1.5rem;text-align:center;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}'+
        '.menu-suspended__symbol{font-size:2.2rem;color:var(--primary);margin-bottom:1rem}'+
        '.menu-suspended h2{font-family:var(--font-head);font-size:clamp(2rem,5vw,3rem);margin:0 0 1rem}'+
        '.menu-suspended p{font-size:1.1rem;line-height:1.7;max-width:630px;margin:0 auto}'+
        'body.ldv-menu-suspended .menu-posters,body.ldv-menu-suspended .catbar{display:none!important}';
      document.head.appendChild(style);
    }
  }

  function render() {
    if (!data) return;
    if (data.menu_enabled === 0) { renderSuspended(); return; }
    setMenuSuspended(false);
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
    renderPdfDownloadButton();

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
    fetch(API, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
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

  /* ------------------------------------------------------------
   * Scarica PDF — genera il menu' PUBBLICO corrente al momento
   * del clic. Nessun PDF statico e nessuna modifica al backend.
   * Libreria caricata solo su richiesta (pdfmake + Roboto).
   * ------------------------------------------------------------ */
  var PDF_STRINGS = {
    it: {
      button: 'Scarica il menù in PDF', heading: 'Porta il menù con te',
      hint: 'PDF aggiornato con i piatti e i prezzi attualmente pubblicati.',
      loading: 'Preparazione del PDF in corso…',
      error: 'Non è possibile generare il PDF ora. Riprova tra poco.',
      title: 'Il menù', updated: 'Generato il', allergens: 'Allergeni',
      allergenGuide: 'Guida agli allergeni', website: 'Menù aggiornato online',
      page: 'Pagina', ingredients: 'Ingredienti'
    },
    en: {
      button: 'Download PDF menu', heading: 'Take our menu with you',
      hint: 'Current dishes and prices, downloaded as a PDF.',
      loading: 'Preparing your PDF…',
      error: 'Unable to generate the PDF right now. Please try again.',
      title: 'Menu', updated: 'Generated on', allergens: 'Allergens',
      allergenGuide: 'Allergen guide', website: 'Updated menu online',
      page: 'Page', ingredients: 'Ingredients'
    },
    fr: {
      button: 'Télécharger le menu PDF', heading: 'Emportez notre carte',
      hint: 'La carte PDF avec les plats et les prix actuellement publiés.',
      loading: 'Préparation du PDF…',
      error: 'Impossible de générer le PDF. Veuillez réessayer.',
      title: 'La carte', updated: 'Généré le', allergens: 'Allergènes',
      allergenGuide: 'Guide des allergènes', website: 'Carte à jour en ligne',
      page: 'Page', ingredients: 'Ingrédients'
    },
    de: {
      button: 'Speisekarte als PDF herunterladen', heading: 'Unsere Karte zum Mitnehmen',
      hint: 'Aktuelle Gerichte und Preise als PDF.',
      loading: 'PDF wird erstellt…',
      error: 'Die PDF-Datei konnte nicht erstellt werden. Bitte erneut versuchen.',
      title: 'Speisekarte', updated: 'Erstellt am', allergens: 'Allergene',
      allergenGuide: 'Allergenübersicht', website: 'Aktuelle Speisekarte online',
      page: 'Seite', ingredients: 'Zutaten'
    }
  };

  // Versione bloccata a pdfmake 0.2.23; mirror alternativo se un CDN non risponde.
  var PDFMAKE_JS = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.23/pdfmake.min.js',
    'https://cdn.jsdelivr.net/npm/pdfmake@0.2.23/build/pdfmake.min.js'
  ];
  var PDFMAKE_FONTS = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.23/vfs_fonts.min.js',
    'https://cdn.jsdelivr.net/npm/pdfmake@0.2.23/build/vfs_fonts.js'
  ];
  var pdfLibrariesPromise = null;
  var pdfFontsReady = false;

  function pdfLabel(language) { return PDF_STRINGS[language] || PDF_STRINGS.it; }

  function renderPdfDownloadButton() {
    if (!data || !Array.isArray(data.items) || data.menu_enabled === 0 || data.pdf_enabled === 0) return;
    var language = lang();
    var label = pdfLabel(language);
    if (!document.getElementById('ldv-pdf-download-style')) {
      var css = document.createElement('style');
      css.id = 'ldv-pdf-download-style';
      css.textContent =
        '.menu-pdf-download{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.35rem;margin-top:2.5rem;padding:1.6rem 1.8rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:0 8px 32px rgba(28,22,20,.07)}' +
        '.menu-pdf-download__text{flex:1 1 230px;min-width:0}' +
        '.menu-pdf-download__title{font-family:var(--font-head);font-size:clamp(1.5rem,3vw,1.95rem);font-weight:600;color:var(--text-dark);margin:0 0 .25rem}' +
        '.menu-pdf-download__hint{color:var(--text-muted);font-size:.92rem;line-height:1.5}' +
        '.menu-pdf-download__actions{display:flex;flex-direction:column;align-items:center;gap:.4rem}' +
        '.menu-pdf-download__button{justify-content:center;text-align:center;white-space:normal;line-height:1.35}' +
        '.menu-pdf-download__button:disabled{opacity:.6;cursor:wait;transform:none}' +
        '.menu-pdf-download__status{font-size:.78rem;color:var(--text-muted);max-width:20rem;text-align:center}' +
        '@media(max-width:680px){.menu-pdf-download{padding:1.25rem;gap:1rem}.menu-pdf-download__actions,.menu-pdf-download__button{width:100%}}';
      document.head.appendChild(css);
    }
    var box = document.createElement('section');
    box.className = 'menu-pdf-download';
    box.setAttribute('aria-label', label.heading);
    box.setAttribute('data-testid', 'menu-pdf-download');
    var info = document.createElement('div');
    info.className = 'menu-pdf-download__text';
    var heading = document.createElement('h2');
    heading.className = 'menu-pdf-download__title';
    heading.textContent = label.heading;
    var hint = document.createElement('p');
    hint.className = 'menu-pdf-download__hint';
    hint.textContent = label.hint;
    info.append(heading, hint);
    var actions = document.createElement('div');
    actions.className = 'menu-pdf-download__actions';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--primary menu-pdf-download__button';
    button.textContent = '↓  ' + label.button;
    button.setAttribute('data-testid', 'menu-download-pdf-btn');
    var status = document.createElement('span');
    status.className = 'menu-pdf-download__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    actions.append(button, status);
    box.append(info, actions);
    root.appendChild(box);

    button.addEventListener('click', function () {
      if (button.disabled) return;
      var downloadLanguage = lang();
      var copy = pdfLabel(downloadLanguage);
      button.disabled = true;
      status.textContent = copy.loading;

      // Una nuova richiesta impedisce di esportare un menu' rimasto
      // aperto nel browser prima di una modifica nel gestionale.
      fetch(API, { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) throw new Error('Menu API HTTP ' + response.status);
          return response.json();
        })
        .then(function (fresh) {
          if (!fresh || fresh.ok !== true || !Array.isArray(fresh.items)) {
            throw new Error('Menu API: dati non validi');
          }
          if (fresh.menu_enabled === 0 || fresh.pdf_enabled === 0) {
            throw new Error('Download PDF disabilitato dal ristorante');
          }
          return Promise.all([loadPdfLibraries(), loadPdfBrandLogo()])
            .then(function (loaded) {
              return buildPdfDocument(fresh, downloadLanguage, copy, loaded[1]);
            });
        })
        .then(function (pdfDoc) {
          var now = new Date();
          var day = now.getFullYear() + '-' + padDate(now.getMonth() + 1) + '-' + padDate(now.getDate());
          var name = 'La_Locanda_di_Vinadio_Menu_' + downloadLanguage.toUpperCase() + '_' + day + '.pdf';
          window.pdfMake.createPdf(pdfDoc).download(name);
          status.textContent = '';
        })
        .catch(function (error) {
          console.error('Download PDF Locanda:', error);
          // In ambiente di test mostra la causa per facilitare la diagnosi.
          var detail = error && error.message ? String(error.message) : '';
          status.textContent = copy.error + (detail ? ' — ' + detail : '');
        })
        .finally(function () { button.disabled = false; });
    });
  }

  function padDate(n) { return String(n).padStart(2, '0'); }

  function loadPdfScript(url) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = function () {
        script.remove();
        reject(new Error('Libreria PDF non caricabile: ' + url));
      };
      document.head.appendChild(script);
    });
  }

  function loadPdfScriptWithFallback(urls) {
    var index = 0;
    function attempt(lastError) {
      if (index >= urls.length) return Promise.reject(lastError);
      return loadPdfScript(urls[index++]).catch(attempt);
    }
    return attempt(new Error('Nessun CDN PDF disponibile'));
  }

  function loadPdfLibraries() {
    if (pdfLibrariesPromise) return pdfLibrariesPromise;
    // Da pdfmake 0.2.15 i font VFS sono registrati internamente con
    // addVirtualFileSystem: pdfMake.vfs puo' essere undefined anche se
    // i font sono stati caricati correttamente.
    if (window.pdfMake && typeof window.pdfMake.createPdf === 'function' &&
        (pdfFontsReady || window.pdfMake.vfs)) {
      return Promise.resolve();
    }
    pdfLibrariesPromise = Promise.resolve()
      .then(function () {
        return (window.pdfMake && typeof window.pdfMake.createPdf === 'function')
          ? null : loadPdfScriptWithFallback(PDFMAKE_JS);
      })
      .then(function () {
        if (!window.pdfMake || typeof window.pdfMake.createPdf !== 'function') {
          throw new Error('Motore PDF non inizializzato');
        }
        if (pdfFontsReady || window.pdfMake.vfs) return null;
        return loadPdfScriptWithFallback(PDFMAKE_FONTS).then(function () {
          // Il caricamento dello script registra direttamente i font nella
          // libreria, senza necessariamente valorizzare pdfMake.vfs.
          pdfFontsReady = true;
        });
      })
      .catch(function (err) {
        pdfLibrariesPromise = null;
        throw err;
      });
    return pdfLibrariesPromise;
  }

  function printable(obj, key, language) {
    if (!obj) return '';
    return String(obj[key + '_' + language] || obj[key + '_it'] || '').trim();
  }

  function translatedNote(key, language) {
    var langs = window.LDV_I18N || {};
    return (langs[language] && langs[language][key]) ||
      (langs.it && langs.it[key]) || '';
  }

  // PDF V3.1: immagine ufficiale del sito, caricata una sola volta.
  // In caso di rete assente mantiene l'intestazione testuale: il download continua.
  var pdfBrandLogoPromise = null;
  function loadPdfBrandLogo() {
    if (pdfBrandLogoPromise) return pdfBrandLogoPromise;
    pdfBrandLogoPromise = fetch('/favicon.png', { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Logo PDF non disponibile');
        return res.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () { resolve(reader.result); };
          reader.onerror = function () { reject(new Error('Logo PDF non leggibile')); };
          reader.readAsDataURL(blob);
        });
      })
      .catch(function (err) {
        console.warn('PDF Locanda: utilizzo intestazione testuale', err);
        return null;
      });
    return pdfBrandLogoPromise;
  }

  // Disegno originale SVG, indipendente dall'ordine di visualizzazione.
  var PIZZA_PDF_VETTORIALE = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"124\" height=\"124\" viewBox=\"0 0 124 124\">  <path d=\"M62 8 C87 8 110 27 115 52 C122 82 101 110 70 116 C36 121 9 102 8 69 C5 37 29 10 62 8Z\" fill=\"#B7753D\" stroke=\"#75422B\" stroke-width=\"2.4\"/>  <path d=\"M62 15 C85 15 106 31 109 55 C113 79 96 102 70 108 C44 114 19 96 16 70 C12 45 33 17 62 15Z\" fill=\"#DEAE68\" stroke=\"#F1CF8A\" stroke-width=\"2.1\"/>  <path d=\"M61 23 C85 20 98 38 101 59 C104 81 89 96 65 100 C42 104 26 88 24 69 C20 45 39 26 61 23Z\" fill=\"#A74C34\"/>  <path d=\"M44 34 C53 29 63 30 67 37 C71 43 66 51 58 52 C48 53 39 45 44 34Z M73 47 C85 43 93 51 92 62 C91 70 83 74 74 71 C68 68 65 51 73 47Z M34 62 C42 55 50 59 53 67 C55 75 47 82 39 81 C30 79 27 69 34 62Z M61 76 C71 67 81 73 82 84 C82 93 73 98 64 96 C56 93 55 82 61 76Z\" fill=\"#F7E7BB\" stroke=\"#E8D4A2\" stroke-width=\"1.3\"/>  <path d=\"M48 34 C53 36 56 39 61 38 M79 51 C83 55 85 59 84 64 M34 68 C37 70 42 72 44 71\" fill=\"none\" stroke=\"#FFFFFF\" stroke-opacity=\".7\" stroke-width=\"2\" stroke-linecap=\"round\"/>  <path d=\"M61 54 Q49 44 46 49 Q42 57 61 54Z M60 54 Q56 36 64 35 Q72 42 60 54Z\" fill=\"#416C45\" stroke=\"#254F34\" stroke-width=\".8\"/>  <path d=\"M75 80 Q69 67 76 65 Q83 69 75 80Z M75 80 Q88 72 91 79 Q88 87 75 80Z\" fill=\"#5E8750\" stroke=\"#315D3E\" stroke-width=\".8\"/>  <path d=\"M39 52 Q36 42 29 44 Q25 51 39 52Z M39 52 Q44 41 48 45 Q48 53 39 52Z\" fill=\"#547C49\" stroke=\"#315D3E\" stroke-width=\".8\"/>  <path d=\"M42 88 Q40 78 47 77 Q55 80 42 88Z M42 88 Q52 89 51 95 Q45 99 42 88Z\" fill=\"#4C754A\" stroke=\"#315D3E\" stroke-width=\".8\"/>  <path d=\"M25 46 Q30 29 46 24 M86 28 Q103 39 106 56 M89 99 Q101 91 108 78\" fill=\"none\" stroke=\"#F7DDAA\" stroke-width=\"3.1\" stroke-linecap=\"round\"/>  <path d=\"M45 19 Q39 21 36 24 M82 20 Q90 25 94 30 M13 61 Q13 69 17 75 M68 111 Q79 109 84 107\" fill=\"none\" stroke=\"#87502F\" stroke-width=\"2.1\" stroke-linecap=\"round\"/>  <circle cx=\"84\" cy=\"35\" r=\"2.5\" fill=\"#8E332B\"/><circle cx=\"31\" cy=\"54\" r=\"2.4\" fill=\"#863426\"/><circle cx=\"88\" cy=\"88\" r=\"2.1\" fill=\"#863426\"/><circle cx=\"57\" cy=\"90\" r=\"2\" fill=\"#863426\"/></svg>";

  function buildPdfDocument(fresh, language, label, brandLogoData) {
    var locale = language === 'en' ? 'en-IE' :
      language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : 'it-IT';
    var now = new Date();
    var stamp = new Intl.DateTimeFormat(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(now);
    var menuUrl = 'https://www.lalocandadivinadio.it/menu.html';
    var currentCategory = null;
    var motto = {
      it: 'RISTORANTE  ·  PIZZERIA  ·  VALLE STURA',
      en: 'RESTAURANT  ·  PIZZERIA  ·  STURA VALLEY',
      fr: 'RESTAURANT  ·  PIZZERIA  ·  VALLÉE STURA',
      de: 'RESTAURANT  ·  PIZZERIA  ·  STURA-TAL'
    };
    var goodbye = {
      it: 'Grazie per aver scelto La Locanda di Vinadio',
      en: 'Thank you for choosing La Locanda di Vinadio',
      fr: 'Merci d’avoir choisi La Locanda di Vinadio',
      de: 'Vielen Dank, dass Sie La Locanda di Vinadio gewählt haben'
    };
    var content = [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 498, y2: 0,
        lineWidth: 0.7, lineColor: '#C7AA81' }], margin: [0, 0, 0, 10] }
    ];
    if (brandLogoData) {
      content.push({ image: brandLogoData, width: 83, alignment: 'center',
        margin: [0, 0, 0, 8] });
    } else {
      content.push({ text: 'LA LOCANDA', style: 'brand', alignment: 'center' });
      content.push({ text: 'D I  V I N A D I O', style: 'brandSub', alignment: 'center' });
    }
    content.push({ text: motto[language] || motto.it,
      style: 'motto', alignment: 'center', margin: [0, 0, 0, 5] });
    content.push({ text: label.title, style: 'title', alignment: 'center',
      margin: [0, 6, 0, 10] });
    content.push({ text: (window.LDV_SITE && window.LDV_SITE.address) ||
      'Via Roma, 16 — 12010 Vinadio (CN)', style: 'address', alignment: 'center' });
    content.push({ text: (window.LDV_SITE && window.LDV_SITE.phoneDisplay) ||
      '0171 959506', style: 'address', alignment: 'center' });
    content.push({ text: label.updated + ' ' + stamp,
      style: 'stamp', alignment: 'center' });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 498, y2: 0,
      lineWidth: 0.9, lineColor: '#AD6E48' }], margin: [0, 13, 0, 10] });
    var items = fresh.items || [];
    items.forEach(function (item) {
      var categoryId = String(item.category_id);
      if (categoryId !== currentCategory) {
        currentCategory = categoryId;
        content.push({
          stack: [
            // Segue la categoria pizze anche quando cambia posizione nel gestionale.
            ...(Number(item.category_id) === 3 ||
                 /pizz/i.test(String(item.category_it || ''))
              ? [{ svg: PIZZA_PDF_VETTORIALE, width: 54, alignment: 'center',
                   margin: [0, 0, 0, 9] }]
              : [] ),
            { canvas: [{ type: 'line', x1: 145, y1: 0, x2: 340, y2: 0,
              lineWidth: 0.75, lineColor: '#C2A47B' }], margin: [0, 0, 0, 11] },
            { text: printable(item, 'category', language).toUpperCase(),
              style: 'category', alignment: 'center' },
            { canvas: [{ type: 'line', x1: 145, y1: 0, x2: 340, y2: 0,
              lineWidth: 0.75, lineColor: '#C2A47B' }], margin: [0, 11, 0, 0] }
          ],
          keepWithNext: true,
          margin: [0, 19, 0, 15]
        });
      }
      var name = printable(item, 'name', language);
      var desc = printable(item, 'description', language);
      var ingredients = (item.ingredients || [])
        .map(function (ingredient) { return printable(ingredient, 'name', language); })
        .filter(Boolean);
      var allergens = (item.allergens || [])
        .map(function (allergen) { return printable(allergen, 'name', language); })
        .filter(Boolean);
      // Stessa regola della pagina web per mostrare la descrizione.
      var descriptionToShow = (desc && desc.toLowerCase() !== name.toLowerCase())
        ? desc : (!desc ? ingredients.join(', ') : '');
      var cents = Number(item.price_cents);
      var amount = (item.price_cents === undefined || item.price_cents === null ||
        !Number.isFinite(cents)) ? '' : new Intl.NumberFormat(locale, {
        style: 'currency', currency: 'EUR'
      }).format(cents / 100);
      var stack = [{ columns: [
        { text: name || '—', style: 'dishName', width: '*' },
        { text: amount, style: 'dishPrice', alignment: 'right', width: 'auto' }
      ], columnGap: 8 }];
      if (descriptionToShow) {
        stack.push({ text: descriptionToShow, style: 'dishDesc', margin: [0, 3, 0, 0] });
      }
      if (allergens.length) {
        stack.push({ text: label.allergens + ': ' + allergens.join(', '),
          style: 'dishAllergens', margin: [0, 3, 0, 0] });
      }
      content.push({ stack: stack, unbreakable: true, margin: [6, 0, 6, 14] });
    });

    var frozen = translatedNote('menu.note.frozen', language);
    var allergenNote = translatedNote('menu.note.allergens', language);
    if (frozen || allergenNote) {
      content.push({ text: [frozen, allergenNote].filter(Boolean).join('\n'),
        style: 'notes', margin: [0, 16, 0, 6] });
    }
    if (Array.isArray(fresh.allergens) && fresh.allergens.length) {
      content.push({
        stack: [
          { canvas: [{ type: 'line', x1: 145, y1: 0, x2: 340, y2: 0,
            lineWidth: 0.75, lineColor: '#C2A47B' }], margin: [0, 0, 0, 11] },
          { text: label.allergenGuide, style: 'category', alignment: 'center' },
          { canvas: [{ type: 'line', x1: 145, y1: 0, x2: 340, y2: 0,
            lineWidth: 0.75, lineColor: '#C2A47B' }], margin: [0, 11, 0, 0] }
        ], margin: [0, 22, 0, 12], keepWithNext: true
      });
      fresh.allergens.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); })
        .forEach(function (item) {
          content.push({ text: String(item.id) + '. ' + printable(item, 'name', language),
            style: 'allergenLine', margin: [0, 0, 0, 3] });
        });
    }
    content.push({ text: goodbye[language] || goodbye.it,
      style: 'signature', alignment: 'center', margin: [0, 21, 0, 3] });
    content.push({ text: label.website + ': ' + menuUrl, link: menuUrl,
      color: '#8C3B24', decoration: 'underline', style: 'link', margin: [0, 8, 0, 0] });
    return {
      info: { title: 'La Locanda di Vinadio - ' + label.title,
        author: 'La Locanda di Vinadio', subject: label.title },
      pageSize: 'A4',
      // Avorio molto tenue; colore di sfondo valido per ogni pagina A4.
      background: function (pageNumber, pageSize) {
        return { canvas: [{ type: 'rect', x: 0, y: 0,
          w: pageSize.width, h: pageSize.height, color: '#FBF8F2' }] };
      },
      pageMargins: [48, 46, 48, 65],
      content: content,
      footer: function (pageNumber, pageCount) {
        return {
          margin: [48, 0, 48, 0],
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 498, y2: 0,
              lineWidth: 0.65, lineColor: '#C2A47B' }], margin: [0, 0, 0, 8] },
            { columns: [
                { text: 'LA LOCANDA DI VINADIO', bold: true, width: 'auto' },
                { text: 'Via Roma 16 · 0171 959506', alignment: 'center', width: '*' },
                { text: label.page + ' ' + pageNumber + ' / ' + pageCount,
                  alignment: 'right', width: 'auto' }
              ], fontSize: 7.8, color: '#7B6656' }
          ]
        };
      },
      defaultStyle: { font: 'Roboto', color: '#2C1A12', fontSize: 10 },
      styles: {
        brand: { fontSize: 22, bold: true, characterSpacing: 1.5, color: '#3F2A22' },
        brandSub: { fontSize: 9, bold: true, characterSpacing: 1.2, color: '#A04B2F',
          margin: [0, 1, 0, 3] },
        motto: { fontSize: 7.2, characterSpacing: 1.0, color: '#8B7662' },
        title: { fontSize: 27, bold: false, color: '#8C3B24', margin: [0, 2, 0, 8] },
        address: { fontSize: 8.8, color: '#6B5D52', margin: [0, 1, 0, 1] },
        stamp: { fontSize: 8, italics: true, color: '#827267', margin: [0, 9, 0, 0] },
        category: { fontSize: 16, bold: true, color: '#8C3B24', alignment: 'center', characterSpacing: 0.8 },
        dishName: { bold: true, fontSize: 11.2 },
        dishPrice: { bold: true, fontSize: 10.8, color: '#8C3B24' },
        dishDesc: { color: '#6B5D52', fontSize: 9, lineHeight: 1.2 },
        dishAllergens: { color: '#8C3B24', fontSize: 8.3 },
        notes: { fontSize: 8.7, color: '#6B5D52', lineHeight: 1.25 },
        allergenLine: { fontSize: 9 },
        signature: { fontSize: 10, italics: true, color: '#8C5A40' },
        link: { fontSize: 9, alignment: 'center' }
      }
    };
  }

  window.addEventListener('ldv:lang', function () { if (data) render(); });
  // Alla riapertura della scheda aggiorna lo stato senza attendere la ricarica manuale.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) load();
  });

  load();
})();
