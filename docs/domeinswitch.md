# Domeinswitch: van WordPress naar de nieuwe site

De nieuwe site komt op dezelfde shared hosting als WordPress (Apache + PHP). Werk in deze volgorde: elke stap kan je testen voor je verder gaat, en tot stap 6 blijft WordPress gewoon online.

## 1. Nieuws migreren

1. GitHub → Actions → **Nieuws migreren uit WordPress** → Run workflow (branch `main`, bron `https://testsite.badminton-pbo.be` of de echte site).
2. Lees `scripts/uitvoer/migratie-rapport.md` na:
   - **Categorieën**: klopt de indeling? Anders `CATEGORIE_REGELS` in `scripts/migreer-wordpress.mjs` aanpassen en opnieuw draaien.
   - **Interne links zonder nieuwe bestemming**: een redirect toevoegen aan `OUDE_PAGINAS` in `scripts/oude-site.mjs` (de migratie, de `.htaccess` en de controle lezen die lijst), of een pagina die haar pad houdt aan `PAGINA_MAP` in het migratiescript.
   - **Uploads die niet te downloaden waren**: zelf opzoeken of de link in het bericht aanpassen.
   - **pbo.kwal.org**: die links zijn al vervangen door relatieve paden. Kijk na of de bestanden bestaan.
3. Kijk een paar oude berichten na op de testversie (GitHub Pages).
4. Vervang de voorbeeldstanden in `src/content/rankings/2026-09-26-de-mintons/` door de echte stand (via `/admin/jeugdcup/`), of verwijder ze. Een build voor `www.badminton-pbo.be` laat standen met `voorbeeld: true` sowieso weg (de build meldt dat), dus verzonnen namen komen nooit op de echte site.

## 2. Login voor /admin

Zie `docs/beheer.md`, "Eenmalig instellen": OAuth App op GitHub, secrets `OAUTH_CLIENT_ID` en `OAUTH_CLIENT_SECRET`.

## 3. Testen op een subdomein

1. Maak bij de hostingprovider een subdomein, bv. `nieuw.badminton-pbo.be`, met een eigen map.
2. Zet in GitHub (Settings → Secrets and variables → Actions):
   - variabelen `FTP_SERVER`, `FTP_SERVER_DIR` (de map van het subdomein, met `/` op het einde), `SITE_URL` = `https://nieuw.badminton-pbo.be`
   - eventueel `FTP_PROTOCOL` (`ftps` is standaard, `ftp` als de hosting geen FTPS kent)
   - secrets `FTP_USERNAME`, `FTP_PASSWORD`
3. Zet de callback-URL van de OAuth App tijdelijk op `https://nieuw.badminton-pbo.be/admin/auth/`, en de variabele `CMS_AUTH_URL` op `https://nieuw.badminton-pbo.be` (dan werkt ook de login op GitHub Pages).
4. Run **Deploy naar de hosting** (of push naar `main`).
5. Test:
   - de site, de ranking (filters, zoeken), het nieuws (zoeken)
   - inloggen op `/admin/` en `/admin/jeugdcup/` met een GitHub-account, een stand toevoegen
   - `node scripts/controleer-redirects.mjs --site https://nieuw.badminton-pbo.be`: alle oude adressen en uploads

Het subdomein krijgt automatisch `noindex`: enkel `www.badminton-pbo.be` wordt door Google geïndexeerd.

## 4. Gebruikers

Nodig elk GitHub-account uit als collaborator met rol **Write** (zie `docs/beheer.md`). Laat iedereen één keer inloggen en een test doen.

## 5. Beslissen wat er met WordPress gebeurt

Nog open. Twee mogelijkheden:

- **Uitschakelen**: maak een volledige back-up (bestanden en database) en verwijder daarna de WordPress-bestanden uit de root, behalve `wp-content/uploads/`. Pdf's waar nog externe links naar wijzen, blijven dan bereikbaar, ook als ze niet gemigreerd zijn.
- **Archief op een subdomein**: zet WordPress op bv. `oud.badminton-pbo.be` (bestanden verplaatsen, `siteurl` en `home` aanpassen in de database). Dat vraagt meer werk en onderhoud (updates).

Hoe dan ook: maak eerst een back-up.

## 6. De switch

1. Back-up van WordPress (bestanden en database).
2. Zet de variabelen om: `FTP_SERVER_DIR` = de root van `www.badminton-pbo.be` (bv. `public_html/`), `SITE_URL` en `CMS_AUTH_URL` leeg (= `https://www.badminton-pbo.be`). Callback-URL van de OAuth App terug naar `https://www.badminton-pbo.be/admin/auth/`.
3. Run **Deploy naar de hosting**. Op dat moment:
   - `index.html` en de nieuwe `.htaccess` overschrijven die van WordPress: de nieuwe site staat online.
   - `wp-content/uploads/` blijft staan; de gemigreerde bestanden worden er opnieuw in gezet (zelfde inhoud).
4. Ruim WordPress op volgens de keuze in stap 5. De deploy verwijdert zelf nooit bestanden die hij niet geüpload heeft.
5. Controleer: `node scripts/controleer-redirects.mjs` (zonder `--site` = www.badminton-pbo.be).
6. Google Search Console: dien `https://www.badminton-pbo.be/sitemap-index.xml` in en volg de 404's de eerste weken op.

## Terug naar WordPress

Zolang de WordPress-bestanden en de database er nog zijn: zet de `.htaccess` en `index.php` van WordPress terug uit de back-up en verwijder `index.html`.
