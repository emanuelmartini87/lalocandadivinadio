/* La Locanda di Vinadio — galleria auto-caricata da assets/img/galleria/
   Basta caricare foto con nome 01.jpg, 02.jpg ... fino a 12.jpg:
   compaiono automaticamente sul sito, senza toccare il codice. */
(function () {
  'use strict';

  var grid = document.querySelector('[data-galleria]');
  if (!grid) return;

  var MAX = 12;
  var base = grid.getAttribute('data-galleria') || 'assets/img/galleria/';

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(src); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  var loads = [];
  for (var i = 1; i <= MAX; i++) {
    var n = (i < 10 ? '0' : '') + i;
    loads.push(loadImage(base + n + '.jpg'));
  }

  Promise.all(loads).then(function (results) {
    var found = results.filter(Boolean);
    if (!found.length) return;
    var section = grid.closest('section');
    grid.innerHTML = found.map(function (src, idx) {
      return '<button class="galleria__item" type="button" data-testid="galleria-' + (idx + 1) + '" ' +
        'data-src="' + src + '" aria-label="' + window.t('ui.enlarge') + '">' +
        '<img src="' + src + '" alt="La Locanda di Vinadio — fotografia ' + (idx + 1) + '" loading="lazy">' +
        '</button>';
    }).join('');
    grid.querySelectorAll('.galleria__item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.LDV_openLightbox({ img: btn.getAttribute('data-src'), title: 'La Locanda di Vinadio' });
      });
    });
    if (section) section.hidden = false;
  });
})();
