# Beheer van de PBO-website

De site haalt alles uit bestanden in deze GitHub-repo. Wie iets aanpast in `/admin`, maakt een commit. GitHub bouwt de site dan opnieuw, en een paar minuten later staat de wijziging online.

## Wie mag wat

| Wie | Adres | Wat |
|---|---|---|
| Gewone user (jeugdcup) | `https://www.badminton-pbo.be/admin/jeugdcup/` | Enkel standen van de jeugdcuptour toevoegen en aanpassen |
| Beheerder | `https://www.badminton-pbo.be/admin/` | Rankings, jeugdcupkalender, nieuws, vaste pagina's, site-instellingen |

Iedereen logt in met een eigen GitHub-account. Dat account heeft schrijfrechten op de repo nodig: een beheerder nodigt het uit via GitHub → `LennartMart/pbo-website` → Settings → Collaborators → Add people (rol **Write**).

Let op: GitHub kent geen rechten per map. Een gewone user ziet in `/admin/jeugdcup/` enkel de rankings, maar kan technisch via GitHub of `/admin` ook andere bestanden aanpassen. Bij een klein, vertrouwd team is dat aanvaardbaar. Elke wijziging staat met naam in de geschiedenis en is terug te draaien.

## Stand toevoegen na een jeugdcup

1. Ga naar `/admin/jeugdcup/` en log in met GitHub.
2. Klik op **+ stand**.
3. Kies het toernooi, de categorie en jongens of meisjes.
4. Selecteer in Excel de rijen van de stand, van de eerste tot de laatste speler (de kopregel mag mee). Kopieer en plak ze in **Stand plakken**.
   - Lidnummers en punten per halte mogen mee: de site neemt positie, naam, club en het totaal in de laatste kolom.
   - Een gedeelde plaats: laat de positie leeg, dan krijgt de speler de positie van de rij erboven.
5. Rechts zie je meteen de tabel zoals ze op de site komt. Klopt het aantal rijen?
6. Optioneel: voeg de pdf toe.
7. Klik **Publiceer → Publiceer nu**. Herhaal voor de andere categorieën, jongens en meisjes: tien standen per halte (tip: **Publiceer en dupliceer item** houdt het toernooi al ingevuld).

De site toont per categorie, jongens en meisjes apart, altijd de stand van het laatste toernooi in dat kalenderjaar. Een fout verbeteren: open de stand, pas aan en publiceer opnieuw.

## Jeugdcupkalender (beheerders)

De kalender heeft één item per seizoen (augustus tot juli), met een lijst haltes. Zo zet je een hele kalender in één keer online.

- **Nieuw seizoen:** **Jeugdcup-kalender → + seizoen**, vul het seizoen in (bv. `2027-2028`) en klik bij **Haltes** zo vaak als nodig op **+ halte**. Publiceer één keer.
- **Haltes toevoegen of schrappen:** open het seizoen, voeg toe of verwijder met het kruisje bij de halte, en publiceer. De volgorde maakt niet uit: de site zet ze op datum.
- **Per halte:** datum, club, sporthal, adres en beginuur (voor de routelink), prijsuitreiking, en zodra het toernooi op tournamentsoftware staat de **toernooilink** en **Inschrijven tot**.
- **Twee data per toernooi:** de **datum** is de speeldag, **Inschrijven tot** de laatste dag om in te schrijven. Bij een toernooilink is "Inschrijven tot" verplicht: zonder die datum bouwt de site niet en blijft de vorige versie online.
- **Toernooilink:** één link per halte, die je nooit hoeft te vervangen. De knop op de home en de kalender past zich aan: **Inschrijven tot ...** tot en met de datum bij **Inschrijven tot**, daarna **Wedstrijden** tot en met de speeldag, en na de halte **Uitslagen**.
- **Inschrijvingen open:** op de home staan onder de volgende halte alle latere haltes waarvoor je nu kan inschrijven, elk tot de laatste inschrijfdag. Bij de volgende halte zelf staat "inschrijvingen afgesloten" zodra die datum voorbij is. Een halte komt er vanzelf bij zodra ze een toernooilink en "Inschrijven tot" heeft.
- Een nieuwe halte verschijnt in de keuzelijst bij de rankings na de volgende build, binnen een paar minuten.

Een gespeelde halte met standen niet verwijderen, anders bouwt de site niet meer. De datum, de club of de sporthal verbeteren mag wel. Een seizoen verwijderen kan niet in het beheer.

## Vaste pagina's (beheerders)

**Vaste pagina's** bevat per pagina de titel, de intro, de lopende tekst en de lijsten: bestuursleden met foto, medewerkers, provinciale bijdrage, documenten, trainers, vacatures, reglement en archief van de jeugdcuptour. De opmaak eromheen (kaarten, knoppen, kalender) zit in de code.

Bij **Jeugdcuptour** staan ook de **geboortejaren per categorie**. Ze komen in de tabel "Categorieën" en bij de filters van de ranking. Vul ze in voor één kalenderjaar, bijvoorbeeld 2026: U13 van 2014 tot en met 2015. Het jaar erna schuift de site ze zelf op (U13 in 2027: 2015 en 2016). Enkel aanpassen als de leeftijdsgrenzen veranderen. Minibad heeft geen "tot en met": leeg betekent "of later". De categorieën zelf (Minibad, U11, ...) zitten in de code, want de standen verwijzen ernaar.

## Nieuws bovenaan de home (beheerders)

Open het bericht, zet **Uitgelicht** aan en publiceer. Het bericht staat dan bovenaan het nieuwsoverzicht en bovenaan de home:

- zolang de jeugdcup een volgende halte heeft, als blok net onder die halte (en boven het PK-blok);
- als alle haltes gespeeld zijn en de nieuwe kalender nog niet online staat, in de plaats van de halte, groot bovenaan.

Is de titel lang, vul dan **Korte titel voor de home** in. Er staat altijd maar één bericht bovenaan: het nieuwste dat uitgelicht is. Zet **Uitgelicht** weer uit als het niet meer actueel is.

## Provinciaal kampioenschap (beheerders)

Het PK heeft een eigen pagina (`/pk`) en een blok op de home. Je hoeft er geen nieuwsbericht voor te maken.

1. Open **Vaste pagina's → PK (provinciaal kampioenschap)**.
2. Vul de data, de plaats, de organisatie, de **toernooilink** (tournamentsoftware) en **Inschrijven tot** in (verplicht bij een toernooilink). Sporthal en adres zijn optioneel; met een adres krijgt `/pk` een routeknop.
3. Zet in **Tekst** de reeksen, het uurschema en de praktische info. Een affiche mag erbij.
4. Zet **Tonen op de home** aan en publiceer.

Hetzelfde blok dient ook voor het **PK Jeugd en Veteranen** in februari: verander de **Naam** (het jaar zet de site er zelf achter) en vul de gegevens van dat PK in. De twee PK's lopen niet tegelijk.

De knop past zich aan zoals bij de jeugdcupkalender: **Inschrijven tot ...**, daarna **Wedstrijden**, na het PK **Uitslagen**. Zet **Tonen op de home** uit wanneer het PK voorbij is. De pagina `/pk` blijft bestaan met de info van het laatste PK, tot je ze het jaar erna overschrijft.

## Site-instellingen (beheerders)

**Site-instellingen → Contact, sponsors en links**:

- **Mailadressen** van secretariaat, jeugdcup, recreanten en voorzitter. Ze staan in de footer en op elke pagina die naar contact verwijst (ranking, kalender, competitie, ...).
- **Sociale media** onder "Volg ons" in de footer.
- **Sponsors** boven de footer: naam, website en logo. Eén sponsor krijgt een groot logo, meerdere staan naast elkaar. Zonder sponsors verdwijnt het blok.
- **Competitie**: de links naar de competitieagenda en naar uitslagen en standen bij Badminton Vlaanderen.

Links beginnen altijd met `https://`. Het hoofdmenu, de vaste footerlinks (Bestuur, Vacatures, PBO-kalender) en de Google-agenda zitten in de code.

## Eenmalig instellen: login met GitHub

Decap heeft een kleine loginhelper nodig: `public/admin/auth/index.php`. Die moet op de hosting staan.

1. Maak een OAuth App op GitHub, onder het account of de organisatie die de repo beheert: Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `https://www.badminton-pbo.be`
   - Authorization callback URL: `https://www.badminton-pbo.be/admin/auth/` (of het testsubdomein, zie `docs/domeinswitch.md`)
2. Zet in de repo onder Settings → Secrets and variables → Actions:
   - secrets `OAUTH_CLIENT_ID` en `OAUTH_CLIENT_SECRET` (uit de OAuth App)
   - secrets `FTP_USERNAME`, `FTP_PASSWORD` en variabelen `FTP_SERVER`, `FTP_SERVER_DIR` (van de hostingprovider)
3. De workflow **Deploy naar de hosting** schrijft bij elke deploy `admin/auth/config.php` met die geheimen.

De testversie op GitHub Pages gebruikt dezelfde loginhelper (variabele `CMS_AUTH_URL`, standaard `https://www.badminton-pbo.be`). Inloggen op de testversie lukt dus pas als de helper op de hosting staat.

## Lokaal testen zonder GitHub

```sh
npx decap-server   # in een tweede terminal
npm run dev        # open http://localhost:4321/admin/ en klik Inloggen
```

Wijzigingen komen dan rechtstreeks in je werkmap terecht, zonder commit.
