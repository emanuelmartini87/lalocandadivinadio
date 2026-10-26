# LA LOCANDA DI VINADIO — NUOVA GRAFICA IN TEST

Questa cartella `v2-test/` è un nuovo frontend basato sulla grafica di Emergent
adattata alla struttura attuale. È volutamente separata dal sito online.

## Pubblicazione TEST (sicura)
1. Apri il repository GitHub `emanuelmartini87/lalocandadivinadio` branch `main`.
2. Carica SOLTANTO la cartella `v2-test/` dal pacchetto di anteprima.
   Meglio con GitHub Desktop: estrai il pacchetto nella copia locale del
   repository, poi Commit + Push.
3. Apri `https://www.lalocandadivinadio.it/v2-test/`.
   Menu: `/v2-test/menu.html` | Eventi: `/v2-test/eventi.html`
   Contatti: `/v2-test/contatti.html`.
4. Collega i dati **pubblici** già esistenti di PRODUZIONE (solo lettura):
   - menu: `https://locanda-menu-public.emanuel-martini87.workers.dev/api/public/menu`
   - locandine: `https://locanda-menu-public.emanuel-martini87.workers.dev/api/public/locandine`
5. Il gestionale `/admin/` NON viene installato qui né modificato.
   Usa sempre `https://www.lalocandadivinadio.it/admin/` per le modifiche.

## Fotografie sostituibili
`v2-test/assets/img/hero.jpg` — copertina
`v2-test/assets/img/sala.jpg` — locale
`v2-test/assets/img/pizza.jpg` — pizza/menu
`v2-test/assets/img/piatto.jpg` — piatto
`v2-test/assets/img/territory.jpg` — territorio

Le 5 foto nel template sono DIMOSTRATIVE. Per cambiarle sostituisci i file
con foto autentiche mantenendo lo stesso nome e tipo JPG (nessuna modifica JS).
Per foto extra usa `v2-test/assets/img/galleria/01.jpg` ... `12.jpg`.
Foto menu dei singoli piatti: mostrate solo se API fornisce URL; il caricamento
via gestionale richiede ancora sviluppo separato.

## Aggiornare i dati
- telefono, link social e Google: `v2-test/js/site-config.js` (dati iniziali
  ripresi dal vecchio sito).
- testi editoriali e traduzioni: `v2-test/js/i18n.js`.
- dati menu: NON editarli nel codice, usa `/admin/`.
- locandine: NON editarle nel codice, usa `/admin/`.
- privacy policy: ripresa dal sito originale.

## Che cosa viene mantenuto
Tutti i file originali del repository, menu V1, vecchi URL, vecchi test,
ricerche Google e pagina `/admin/`: nessun file originale sovrascritto.
La nuova grafica usa solo HTML/CSS/JS statici: nessun nuovo database,
server, WordPress, React o migrazione DNS.

## NOTA IMPORTANTE
Questa è un'anteprima separata e protetta da `noindex`; prima della
pubblicazione definitiva verificare foto reali, testi, collegamenti e menu
in 4 lingue. Non caricare la cartella `v2-test` sopra la root del sito.
