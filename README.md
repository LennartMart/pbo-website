# Website van PBO vzw

De website van de Provinciale Badmintonraad Oost-Vlaanderen: kalender en ranking van de jeugdcuptour, nieuws, competitie, het provinciaal kampioenschap, recreanten en G-sport, bestuur en vacatures.

Ze vervangt de WordPress-site op badminton-pbo.be. De overstap van het domein is nog niet gebeurd; tot dan draait daar WordPress. Het stappenplan staat in [docs/domeinswitch.md](docs/domeinswitch.md).

## Hoe de site werkt

Er is geen database. Alle inhoud staat als Markdown- of YAML-bestand in deze repo: ruim 800 nieuwsberichten sinds 2011, de haltes van de jeugdcuptour, de standen en de vaste pagina's. Astro maakt daar gewone HTML van.

Wie iets wil aanpassen, doet dat in het beheerscherm. Publiceren is daar hetzelfde als een commit maken: GitHub bouwt de site opnieuw en een paar minuten later staat de wijziging online. Elke wijziging staat met naam in de geschiedenis en is terug te draaien.

Er zijn twee ingangen:

| Adres | Voor wie | Wat je er kan |
|---|---|---|
| `/admin/jeugdcup/` | wie de standen van de jeugdcuptour invoert | standen toevoegen en verbeteren |
| `/admin/` | beheerders | nieuws, jeugdcupkalender, vaste pagina's, het PK, sponsors, mailadressen en links |

Inloggen doe je met een GitHub-account dat schrijfrechten heeft op deze repo. Hoe je een stand plakt, een halte toevoegt of een bericht bovenaan de home zet, lees je in [docs/beheer.md](docs/beheer.md).

## De ranking

Na elke jeugdcup komt er per categorie een tussenstand bij, apart voor jongens en meisjes: tien standen per halte. Je plakt de rijen rechtstreeks uit de Excel van de jeugdcup. Lidnummers en punten per halte mogen mee, de site haalt er positie, naam, club en totaal uit.

De site telt zelf niets op. Ze toont de stand zoals ze in Excel staat, en per categorie altijd die van het laatste toernooi van het kalenderjaar. De ranking loopt dus per kalenderjaar, de kalender per seizoen.

De rankings van 2011 tot 2025 blijven pdf.

## Lokaal draaien

Je hebt Node 24 nodig, de versie waarmee GitHub de site bouwt.

```sh
npm install
npm run dev
```

De site staat dan op `http://localhost:4321`. Zoeken in het nieuws werkt daar niet: de zoekindex wordt pas bij een build gemaakt.

```sh
npm run build     # bouwt naar dist/, maakt de zoekindex en de .htaccess
npm run preview   # toont dist/ zoals het online komt
```

Het beheerscherm testen zonder GitHub kan ook. Start in een tweede terminal `npx decap-server` en open `http://localhost:4321/admin/`. Wat je daar publiceert, komt rechtstreeks in je werkmap terecht, zonder commit.

## Waar staat wat

```
src/content/     de inhoud: nieuws, kalender, rankings, vaste pagina's, PK, instellingen
src/pages/       één bestand per pagina of paginatype
src/components/  header, kaarten, knoppen, tabellen
src/lib/         de regels: volgende halte, stand inlezen, toernooiknop, velden van het beheerscherm
public/          bestanden die ongewijzigd online komen, waaronder de oude uploads
scripts/         migratie uit WordPress, .htaccess, controle van de redirects
docs/            handleiding voor beheerders en het stappenplan voor de domeinswitch
design/          het referentieontwerp
```

De velden van elk type inhoud staan in `src/content.config.ts`. Het contentmodel, de kleuren en de schrijfregels zijn uitgeschreven in [CLAUDE.md](CLAUDE.md).

## Afspraken in de code

- Interne links en bestanden uit `public/` gaan altijd door `u('/pad')` uit `src/lib/url.ts`. De testversie draait in een submap, en zonder `u()` breken de links daar.
- De velden van het beheerscherm staan in `src/lib/cms.ts`, die van de site in `src/content.config.ts`. Pas je het ene aan, pas dan ook het andere aan.
- Wat van de datum afhangt (de volgende halte, "Inschrijven tot", "Wedstrijden", "Uitslagen") moet ook kloppen als er dagen geen build is. De build zet daarom elke toestand in de HTML en de browser toont die van vandaag. Gebruik daarvoor `Periode.astro`.
- Pdf's en afbeeldingen van de oude site staan in `public/wp-content/uploads/` op hun oude pad. Zo blijven links van clubs en van Badminton Vlaanderen werken. Verplaats ze niet.
- Na elke wijziging moet `npm run build` slagen. Een halte met een toernooilink maar zonder inschrijfdatum houdt de build tegen, en dan blijft de vorige versie online.

## Online zetten

Drie workflows in `.github/workflows/`:

- **Deploy naar GitHub Pages** bouwt bij elke push naar `main` een testversie op https://badminton-pbo.github.io/website/. Die krijgt `noindex`, zodat Google ze niet opneemt.
- **Deploy naar de hosting** zet de site via FTP op de hosting van badminton-pbo.be. Ze staat uit tot de variabele `FTP_SERVER` is ingevuld.
- **Nieuws migreren uit WordPress** start je met de hand. Ze haalt alle berichten en gelinkte uploads op en commit ze.

Oude adressen blijven werken: `/2019/03/12/een-bericht/` verwijst door naar `/nieuws/een-bericht`. Na een deploy kijk je dat na met:

```sh
node scripts/controleer-redirects.mjs --site https://www.badminton-pbo.be
```

## Contact

Vragen over de site: secretariaat@badminton-pbo.be. Over de jeugdcuptour en de standen: jeugdcup@badminton-pbo.be.
