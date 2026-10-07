# PBO vzw – nieuwe website (Astro)

Herbouw van badminton-pbo.be (nu WordPress 6.7 op `testsite.badminton-pbo.be`) als statische Astro-site.
Taal van de site: Nederlands (Vlaams). Doelgroep: jeugdspelers en hun ouders, clubs, competitiespelers.

## Kernvereiste

Een **gewone user** mag enkel **uitslagen/rankings van de jeugdcuptour** toevoegen. Al de rest (nieuws, pagina's) beheert een beheerder.

## Stack

- Astro (static output), Tailwind CSS
- Content collections (Markdown/YAML in de repo, geen database)
- Decap CMS (git-based, GitHub-backend) op `/admin` voor beheerders, `/admin/jeugdcup` voor gewone users (enkel rankings). Login met een GitHub-account via een PHP-OAuth-helper op de hosting (`public/admin/auth/`).
- Pagefind voor zoeken in nieuws (client-side)
- Productie: shared hosting (Apache + PHP) op `www.badminton-pbo.be`. Een GitHub Action bouwt en zet de site via (S)FTP online. Redirects staan in `public/.htaccess`.
- Testversie: GitHub Pages op `https://lennartmart.github.io/pbo-website/`, via `.github/workflows/deploy.yml` bij elke push naar `main`. De workflow zet `SITE_URL` en `BASE_PATH`; testversies krijgen `noindex`.
- Interne links en bestanden uit `public/` altijd via `u('/pad')` uit `src/lib/url.ts`, anders breken ze onder het basispad `/pbo-website`.

## Contentmodel

```
src/content/
  nieuws/<slug>.md          title, date, category, excerpt, legacyUrl?
  toernooien/<datum>-<club>.yaml
                            date, club, hall?, prijsuitreiking?  (id = bestandsnaam, seizoen volgt uit de datum)
  rankings/<toernooi-id>/<categorie>-<discipline>.yaml
                            toernooi, categorie, discipline, stand (geplakt uit Excel), pdf?
  paginas/<pagina>.md       vaste pagina's: title, lead, description, lijsten (bestuur, documenten, ...) + lopende tekst
```

- Een ranking is de **tussenstand** na dat toernooi, zoals berekend in Excel. De site telt niets op: per categorie en discipline toont ze de stand van het laatste toernooi in dat kalenderjaar.
- `stand` is tekst met tabs (rechtstreeks geplakt uit Excel): positie, naam, club, punten. Dubbel per paar mag als `naam / naam` of als vier middenkolommen (naam, club, naam, club). Parser: `src/lib/stand.ts`.
- Optioneel een pdf van de stand (`pdf`), getoond als downloadlink naast de tabel.
- Decap-config wordt bij de build gegenereerd uit `src/lib/cms.ts` (`/admin/config.yml`, `/admin/jeugdcup/config.yml`). Velden daar en in `src/content.config.ts` gelijk houden. Handleiding: `docs/beheer.md`.
- Markdown draait op Sätteri (Astro 7). `src/lib/markdown-basis.mjs` zet het basispad voor interne links in Markdown.

- Nieuwscategorieën: `jeugd`, `selectie`, `evenement` (+ eventueel `competitie`, `recreanten`; WordPress-categorieën nog mappen)
- Categorieën jeugdcup: `minibad`, `u11`, `u13`, `u15`, `u17-u19`
- Disciplines: `enkel`, `dubbel`, `gemengd`
- Geboortejaren kalenderjaar 2026: Minibad 2017 of later, U11 2016, U13 2014–2015, U15 2012–2013, U17+U19 2008–2011
- Ranking loopt per **kalenderjaar**, niet per seizoen

## Routes

```
/                                   home
/nieuws, /nieuws/[slug], /nieuws/archief/[jaar]
/jeugd, /jeugd/jeugdcuptour, /jeugd/jeugdcuptour/kalender, /jeugd/jeugdcuptour/ranking
/bestuur, /competitie, /recreanten, /vacatures
/admin, /admin/jeugdcup             Decap CMS (beheerders, gewone users)
```

## Migratie en redirects

- Nieuws: WordPress-berichten (ca. 80 pagina's, 2011–2026) omzetten naar Markdown met `node scripts/migreer-wordpress.mjs` (WP REST API), of via de workflow "Nieuws migreren uit WordPress" (GitHub Actions kan wel aan de WordPress-site). Het script schrijft `scripts/uitvoer/migratie-rapport.md`; categorieën en paginalinks mappen in het script (`CATEGORIE_REGELS`, `PAGINA_MAP`).
- Oude URL's `/YYYY/MM/DD/<slug>/` → `/nieuws/<slug>` via `public/.htaccess` (301).
- `/jeugd/jeugdcup/pbo-jeugdcuptour-ranking/` → `/jeugd/jeugdcuptour/ranking`, idem voor `pbo-jeugdcuptour-kalender`.
- Pdf's uit `wp-content/uploads/` **op hetzelfde pad** bewaren in `public/`, zodat externe links blijven werken. Archiefrankings 2011–2025 blijven voorlopig pdf.
- Sommige oude links wijzen naar `pbo.kwal.org`: opsporen en vervangen.
- De WordPress-site zelf niet aanpassen.

## Externe links (behouden)

- Competitie-app: `https://competitie.badminton-pbo.be/` (`/opstelling`, `/agenda`)
- Google Calendar-embed van `secretariaat@badminton-pbo.be` (zelfde agenda's als nu)
- Mail: `secretariaat@badminton-pbo.be`, `jeugdcup@badminton-pbo.be`
- Facebook `PBO.Badminton`, Instagram `pbobadminton`, X `pbo_badm`
- Sponsor: Mobi-sports (logo in huidige header)
- Badminton Vlaanderen RSS-widget schrappen (feed geeft 404)

## Design

Referentieontwerp staat in `design/*.dc.html` (exports van een designcanvas; niet uitvoerbaar, `support.js` ontbreekt bewust). Gebruik ze voor layout, componenten en copy. Schermen: `Main` (home desktop), `HomeMobile`, `Ranking`, `Nieuws` (overzicht + artikel), `Invoer` (beheerscherm).

De ontwerpen gebruiken nog voorlopige kleuren (donkerblauw). De site gebruikt de PBO-huisstijl: logogroen en het limoengroen uit de huidige header. Tokens staan in `src/styles/global.css` (Tailwind `@theme`):

| token | waarde | gebruik |
|---|---|---|
| ink | `#0C2A20` | diepgroen: tekst, hero, footer, donkere knoppen |
| ground | `#F3F4EF` | pagina-achtergrond |
| paper | `#FFFFFF` | kaarten |
| accent | `#A1F16B` | limoen: primaire knop op donker, rankingkaart |
| accent-soft | `#DCF7C8` | icoonvlakken, zachte kaders |
| brand | `#005E44` | logogroen: labels, links, actieve nav op licht |
| muted | `#4A5852` | secundaire tekst op licht |
| mist | `#BFD3C8` | secundaire tekst op diepgroen |
| line / wash | `#D3D9CF` / `#ECEEE6` | randen, scheidingslijnen |

- Logo: `src/assets/logo/pbo-mark.png` (kleur, transparant) en `pbo-mark-light.png` (wit en limoen, voor diepgroen). Gemaakt uit `wp-content/uploads/2011/05/LOGOKLEU.jpg`.
- Sponsor Mobi-sports staat in de footer, boven het donkere blok.

- Fonts: Bricolage Grotesque (titels, 700/800), Instrument Sans (tekst, 400–600)
- Radius: kaarten 24–32px, knoppen en filters volledig rond
- Touch targets minstens 44px; contrast minstens 4.5:1
- Iconen: inline stroke-SVG, geen emoji in de UI
- Mobiel eerst: menu klapt open, knoppen op volle breedte

## Copy-regels

- Vlaams, je-vorm, kort en concreet: data, plaatsen en clubs noemen
- Geen slogans of opvulzinnen ("samen sterker", "alles op één plek")
- Schrijf voor wie iets zoekt: "Zoek je naam bij U13", "Volgende halte: Gentse BC op 11 oktober"

## Werkwijze

- Werk per fase, één commit per fase. Na elke fase moet `npm run build` slagen.
- Fasen:
  1. Astro-skelet, layout, navigatie, home en statische pagina's
  2. Content collections + jeugdcuptour (kalender en ranking met filters)
  3. Decap CMS met beperkte collectie voor gewone users
  4. Nieuwsmigratie uit WordPress + Pagefind
  5. Redirects, pdf's, domeinswitch

## Beslissingen (oktober 2026)

- Ranking: tabel uit data, met optionele pdf per stand. Archief 2011–2025 blijft pdf.
- Aanlevering: tussenstand uit Excel plakken (positie, naam, club, punten).
- Login: GitHub-account voor iedereen. Gewone users publiceren rechtstreeks, zonder goedkeuring (geen editorial workflow). Het team is klein en niet technisch: geen complexe flows.
- Meerdere beheerders met dezelfde rechten beheren nieuws en vaste pagina's.
- Recreanten & G-sport: inhoud van de huidige site, herschreven.
- Alle nieuws 2011–2026 migreren; alle gelinkte uploads (pdf's en afbeeldingen) op hetzelfde pad.
- Wat er met WordPress gebeurt bij de domeinswitch is nog open (zie `docs/domeinswitch.md`).
