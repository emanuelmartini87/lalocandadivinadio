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
        var allergens = (item.allergens || []).map(function (a) { return field(a, 'name'); }).filter(Boolean);
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
            html += '<span class="tag tag--allergen">' + escapeHtml(a) + '</span>';
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

  window.addEventListener('ldv:lang', function () { if (data) render(); });

  load();
})();
