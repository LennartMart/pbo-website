/**
 * Decap CMS-configuratie, bij de build weggeschreven als /admin/config.yml en /admin/jeugdcup/config.yml.
 * JSON is geldige YAML, dus Decap leest dit gewoon in.
 *
 * - /admin          beheerders: alles
 * - /admin/jeugdcup gewone users: enkel de jeugdcup-rankings
 *
 * Velden moeten overeenkomen met src/content.config.ts.
 */
import { categorieen, geslachten } from './jeugdcup-labels';
import { nieuwsCategorieen } from './nieuws-labels';
import { alleToernooien, type Toernooi } from './jeugdcup';
import { lang, vandaag } from './datum';

const repo = 'LennartMart/pbo-website';
/** Waar de PHP-loginhelper staat (public/admin/auth/). Op GitHub Pages wijst dit naar de echte hosting. */
const authUrl = (process.env.CMS_AUTH_URL || 'https://www.badminton-pbo.be').replace(/\/+$/, '');

const opties = (lijst: readonly { id: string; label: string }[]) => lijst.map((x) => ({ label: x.label, value: x.id }));

const bestand = (label: string, hint?: string) => ({
  label,
  name: 'bestand',
  widget: 'file',
  required: false,
  media_folder: '/public/documenten',
  public_folder: '/documenten',
  choose_url: false,
  ...(hint && { hint }),
});

const documenten = {
  label: 'Documenten',
  name: 'documenten',
  widget: 'list',
  required: false,
  summary: '{{fields.titel}}',
  fields: [
    { label: 'Titel', name: 'titel', widget: 'string' },
    { label: 'Korte uitleg', name: 'tekst', widget: 'string', required: false, hint: 'Bv. "Versie van 24 september 2017 (pdf)"' },
    bestand('Bestand', 'Zonder bestand toont de site "Nog niet online".'),
  ],
};

const paginaVelden = [
  { label: 'Titel', name: 'title', widget: 'string' },
  { label: 'Intro', name: 'lead', widget: 'text', hint: 'De zin onder de titel. Kort en concreet.' },
  { label: 'Omschrijving voor Google', name: 'description', widget: 'text', hint: 'Eén zin, verschijnt in zoekresultaten.' },
];

const tekst = { label: 'Tekst', name: 'body', widget: 'markdown', required: false, buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list'], editor_components: [], modes: ['rich_text'] };

/** Gespeelde toernooien eerst (recentste bovenaan), daarna de komende. Typen filtert de lijst. */
function toernooiOpties(toernooien: Toernooi[]) {
  const nu = vandaag();
  const gespeeld = toernooien.filter((t) => t.date <= nu).reverse();
  const komend = toernooien.filter((t) => t.date > nu);
  return [...gespeeld, ...komend].map((t) => ({ label: `${lang(t.date)} · ${t.club}`, value: t.id }));
}

/**
 * Rankings. Het toernooi is een keuzelijst die bij elke build uit de kalender komt (nieuwste eerst).
 * Geen relation-widget: die vraagt de kalendercollectie in de config, en gewone users mogen de kalender niet zien.
 */
export const rankingsCollectie = async () => ({
  name: 'rankings',
  label: 'Jeugdcup-rankings',
  label_singular: 'stand',
  description:
    'Na elke jeugdcup: kies het toernooi, de categorie en jongens of meisjes, plak de stand uit Excel en klik op Publiceren. Een paar minuten later staat ze op de site.',
  folder: 'src/content/rankings',
  extension: 'yaml',
  format: 'yaml',
  create: true,
  delete: true,
  identifier_field: 'toernooi',
  // Zonder 'fields.': Decap maakt van elke punt in path een streepje.
  path: '{{toernooi}}/{{categorie}}-{{geslacht}}',
  summary: '{{toernooi}} · {{categorie}} {{geslacht}}',
  sortable_fields: ['toernooi', 'categorie', 'geslacht'],
  view_groups: [{ label: 'Toernooi', field: 'toernooi' }],
  view_filters: categorieen.map((c) => ({ label: c.label, field: 'categorie', pattern: c.id })),
  fields: [
    {
      label: '1. Toernooi',
      name: 'toernooi',
      widget: 'select',
      options: toernooiOpties(await alleToernooien()),
      hint: 'De stand na dit toernooi. Staat het er niet bij? Dan staat het nog niet op de kalender: vraag het aan een beheerder.',
    },
    { label: '2. Categorie', name: 'categorie', widget: 'select', options: opties(categorieen) },
    { label: '3. Jongens of meisjes', name: 'geslacht', widget: 'select', options: opties(geslachten) },
    {
      label: '4. Stand plakken',
      name: 'stand',
      widget: 'text',
      hint: 'Selecteer in Excel de rijen van de stand, van de eerste tot de laatste speler, en plak ze hier. Lidnummers en punten per halte mogen mee: de site neemt positie, naam, club en het totaal in de laatste kolom. Rechts zie je hoe het op de site komt.',
    },
    {
      label: 'Pdf van de stand',
      name: 'pdf',
      widget: 'file',
      required: false,
      media_folder: '/public/documenten/jeugdcuptour',
      public_folder: '/documenten/jeugdcuptour',
      choose_url: false,
      hint: 'Verschijnt als downloadlink onder de tabel.',
    },
  ],
});

const datum = { widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'DD-MM-YYYY', time_format: false, picker_utc: true };

/**
 * Eén item per seizoen met een lijst haltes: zo voeg je een hele kalender in één keer toe en schrap je haltes in bulk.
 * Het id van een halte (<datum>-<club>) leidt src/lib/jeugdcup.ts af; standen vinden hun halte desnoods op datum.
 * Seizoenen niet verwijderen: de standen verwijzen naar hun haltes.
 */
const kalenderCollectie = {
  name: 'kalender',
  label: 'Jeugdcup-kalender',
  label_singular: 'seizoen',
  description: 'Eén kalender per seizoen (augustus tot juli). Zet alle haltes in de lijst en publiceer één keer.',
  folder: 'src/content/kalender',
  extension: 'yaml',
  format: 'yaml',
  create: true,
  delete: false,
  identifier_field: 'seizoen',
  slug: '{{seizoen}}',
  summary: 'Seizoen {{seizoen}}',
  sortable_fields: [{ field: 'seizoen', default_sort: 'desc' }],
  fields: [
    { label: 'Seizoen', name: 'seizoen', widget: 'string', pattern: ['^\\d{4}-\\d{4}$', 'Twee jaartallen, bv. 2027-2028'], hint: 'Van augustus tot juli, bv. "2027-2028".' },
    {
      label: 'Haltes',
      label_singular: 'halte',
      name: 'haltes',
      widget: 'list',
      collapsed: true,
      summary: '{{fields.date}} · {{fields.club}}',
      hint: 'De volgorde maakt niet uit: de site zet ze op datum. Een gespeelde halte met standen niet verwijderen.',
      fields: [
        { ...datum, label: 'Datum', name: 'date' },
        { label: 'Club', name: 'club', widget: 'string', hint: 'Zoals de club zichzelf noemt, bv. "Gentse BC".' },
        { label: 'Sporthal', name: 'hall', widget: 'string', required: false },
        { label: 'Adres', name: 'adres', widget: 'string', required: false, hint: 'Straat, nummer en gemeente, bv. "Driepikkelstraat 30, 9030 Mariakerke". Voor de routelink.' },
        { label: 'Beginuur', name: 'start', widget: 'string', required: false, hint: 'Zoals het op de site komt, bv. "9.00 uur".' },
        {
          label: 'Toernooilink',
          name: 'toernooilink',
          widget: 'string',
          required: false,
          pattern: ['^https://\\S+$', 'Volledige link, beginnend met https://'],
          hint: 'De pagina van het toernooi op tournamentsoftware. De knop op de kalender past zich aan: eerst "Inschrijven", dan "Wedstrijden", na de halte "Uitslagen".',
        },
        { ...datum, label: 'Inschrijven tot', name: 'inschrijvenTot', required: false, default: '', hint: 'Laatste dag om in te schrijven. Daarna toont de kalender "Wedstrijden".' },
        { label: 'Prijsuitreiking', name: 'prijsuitreiking', widget: 'boolean', required: false, default: false },
      ],
    },
  ],
};

const paginasCollectie = {
  name: 'paginas',
  label: "Vaste pagina's",
  label_singular: 'pagina',
  description: 'Tekst en lijsten van de vaste pagina\'s. De opmaak eromheen blijft dezelfde.',
  editor: { preview: false },
  files: [
    {
      label: 'Bestuur',
      name: 'bestuur',
      file: 'src/content/paginas/bestuur.md',
      fields: [
        ...paginaVelden,
        {
          label: 'Bestuurders',
          name: 'bestuurders',
          widget: 'list',
          summary: '{{fields.naam}} · {{fields.rol}}',
          fields: [
            { label: 'Naam', name: 'naam', widget: 'string' },
            { label: 'Functie', name: 'rol', widget: 'string' },
            {
              label: 'Foto',
              name: 'foto',
              widget: 'image',
              required: false,
              media_folder: '/src/assets/bestuur',
              public_folder: '../../assets/bestuur',
              choose_url: false,
              hint: 'Vierkant of staand, minstens 200 px breed.',
            },
          ],
        },
        {
          label: 'Medewerkers',
          name: 'medewerkers',
          widget: 'list',
          summary: '{{fields.naam}} · {{fields.rol}}',
          fields: [
            { label: 'Naam', name: 'naam', widget: 'string', hint: 'Nog niemand? Zet "Vacant" en vink vacant aan.' },
            { label: 'Functie', name: 'rol', widget: 'string' },
            { label: 'Vacant', name: 'vacant', widget: 'boolean', required: false, default: false },
          ],
        },
        { ...tekst, label: 'Tekst over werking en lidmaatschap' },
        {
          label: 'Provinciale bijdrage',
          name: 'bijdragen',
          widget: 'list',
          summary: '{{fields.type}}',
          fields: [
            { label: 'Soort club', name: 'type', widget: 'string' },
            { label: 'Per speler', name: 'perSpeler', widget: 'string', hint: 'Bv. "€ 0,68"' },
            { label: 'Minimum', name: 'minimum', widget: 'string', hint: 'Bv. "€ 45"' },
          ],
        },
        documenten,
      ],
    },
    {
      label: 'Jeugd',
      name: 'jeugd',
      file: 'src/content/paginas/jeugd.md',
      fields: [
        ...paginaVelden,
        { ...tekst, label: 'Tekst over de PBO-selectie' },
        {
          label: 'Trainers',
          name: 'trainers',
          widget: 'list',
          summary: '{{fields.naam}} · {{fields.diploma}}',
          fields: [
            { label: 'Naam', name: 'naam', widget: 'string' },
            { label: 'Diploma', name: 'diploma', widget: 'string' },
          ],
        },
      ],
    },
    {
      label: 'Jeugdcuptour',
      name: 'jeugdcuptour',
      file: 'src/content/paginas/jeugdcuptour.md',
      fields: [
        ...paginaVelden.map((v) => (v.name === 'lead' ? { ...v, hint: 'Wordt vervangen door "Volgende halte: ..." zolang er een halte gepland is.' } : v)),
        { ...tekst, label: 'Tekst "Zo werkt het"' },
        { ...documenten, label: 'Reglement en bijlagen' },
        {
          label: 'Archief eindstanden (pdf)',
          name: 'archief',
          widget: 'list',
          required: false,
          summary: '{{fields.label}}',
          hint: 'Nieuwste eerst, bv. "Eindstand 2025".',
          fields: [{ label: 'Naam', name: 'label', widget: 'string' }, { ...bestand('Pdf'), required: true }],
        },
        {
          label: 'Geboortejaren per categorie',
          name: 'geboortejaren',
          widget: 'object',
          hint: 'Voor de tabel "Categorieën" en de filters bij de ranking. Vul ze in voor één kalenderjaar: de jaren erna schuift de site zelf op.',
          fields: [
            { label: 'Kalenderjaar', name: 'jaar', widget: 'number', value_type: 'int', hint: 'Het jaar waarin de geboortejaren hieronder gelden, bv. 2026.' },
            ...categorieen.map((c) => ({
              label: c.label,
              name: c.id,
              widget: 'object',
              fields: [
                { label: 'Geboren van', name: 'van', widget: 'number', value_type: 'int' },
                { label: 'Tot en met', name: 'tot', widget: 'number', value_type: 'int', required: false, hint: 'Leeg = "of later" (Minibad). Eén jaar: twee keer hetzelfde.' },
              ],
            })),
          ],
        },
      ],
    },
    {
      label: 'Competitie',
      name: 'competitie',
      file: 'src/content/paginas/competitie.md',
      fields: [...paginaVelden, tekst],
    },
    {
      label: 'PK (provinciaal kampioenschap)',
      name: 'pk',
      file: 'src/content/pk/pk.md',
      fields: [
        {
          label: 'Tonen op de home',
          name: 'tonen',
          widget: 'boolean',
          required: false,
          default: false,
          hint: 'Aan: een blok op de home met de data, de plaats en de inschrijfknop. Zet het uit na het PK of zolang het volgende niet vastligt. De pagina /pk blijft bestaan.',
        },
        {
          label: 'Naam',
          name: 'naam',
          widget: 'string',
          required: false,
          default: 'Provinciaal kampioenschap',
          hint: 'Het jaar zet de site er zelf achter. Bv. "PK Jeugd en Veteranen" voor het PK in februari.',
        },
        { ...datum, label: 'Eerste dag', name: 'datum' },
        { ...datum, label: 'Tweede dag', name: 'datumTot', required: false, default: '', hint: 'Leeg bij een PK van één dag.' },
        { label: 'Plaats', name: 'plaats', widget: 'string', hint: 'De gemeente, bv. "Nevele".' },
        { label: 'Sporthal', name: 'sporthal', widget: 'string', required: false },
        { label: 'Adres', name: 'adres', widget: 'string', required: false, hint: 'Straat, nummer en gemeente. Voor de routelink.' },
        { label: 'Organisatie', name: 'organisatie', widget: 'string', required: false, hint: 'Bv. "BC Landegem en PBO".' },
        {
          label: 'Toernooilink',
          name: 'toernooilink',
          widget: 'string',
          required: false,
          pattern: ['^https://\\S+$', 'Volledige link, beginnend met https://'],
          hint: 'De pagina van het PK op tournamentsoftware. De knop past zich aan: eerst "Inschrijven", dan "Wedstrijden", na het PK "Uitslagen".',
        },
        { ...datum, label: 'Inschrijven tot', name: 'inschrijvenTot', required: false, default: '', hint: 'Laatste dag om in te schrijven. Staat op de knop.' },
        {
          label: 'Affiche',
          name: 'affiche',
          widget: 'image',
          required: false,
          media_folder: '/public/uploads/pk',
          public_folder: '/uploads/pk',
          choose_url: false,
          hint: 'Optioneel. Staat naast de tekst op /pk.',
        },
        { ...tekst, label: 'Tekst: reeksen, uurschema en praktische info' },
      ],
    },
    {
      label: 'Recreanten & G-sport',
      name: 'recreanten',
      file: 'src/content/paginas/recreanten.md',
      fields: [...paginaVelden, tekst, { ...documenten, label: 'Formulieren' }],
    },
    {
      label: 'Vacatures',
      name: 'vacatures',
      file: 'src/content/paginas/vacatures.md',
      fields: [
        ...paginaVelden,
        {
          label: 'Vacatures',
          name: 'vacatures',
          widget: 'list',
          required: false,
          summary: '{{fields.titel}}',
          hint: 'Leeg = de site meldt dat er geen open plaatsen zijn.',
          fields: [
            { label: 'Functie', name: 'titel', widget: 'string' },
            { label: 'Wat je doet', name: 'tekst', widget: 'text' },
          ],
        },
      ],
    },
  ],
};

const nieuwsCollectie = {
  name: 'nieuws',
  label: 'Nieuws',
  label_singular: 'bericht',
  description: 'Nieuwsberichten. Het nieuwste bericht met "Uitgelicht" staat bovenaan het nieuws en als link op de home.',
  folder: 'src/content/nieuws',
  extension: 'md',
  format: 'frontmatter',
  create: true,
  delete: true,
  slug: '{{title}}',
  summary: '{{date}} · {{title}}',
  sortable_fields: [{ field: 'date', default_sort: 'desc' }, 'title'],
  view_filters: nieuwsCategorieen.map((c) => ({ label: c.label, field: 'category', pattern: c.id })),
  view_groups: [{ label: 'Jaar', field: 'date', pattern: '\\d{4}' }],
  media_folder: '/public/uploads/nieuws',
  public_folder: '/uploads/nieuws',
  fields: [
    { label: 'Titel', name: 'title', widget: 'string', hint: 'Concreet: wat, waar, wanneer. Bv. "Jeugdcuptour: ranking na Gentse BC".' },
    { label: 'Datum', name: 'date', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'DD-MM-YYYY', time_format: false, picker_utc: true },
    { label: 'Categorie', name: 'category', widget: 'select', options: opties(nieuwsCategorieen), default: 'jeugd' },
    { label: 'Korte samenvatting', name: 'excerpt', widget: 'text', hint: 'Eén of twee zinnen. Verschijnt op de nieuwskaart en in Google.' },
    { label: 'Uitgelicht', name: 'uitgelicht', widget: 'boolean', required: false, default: false, hint: 'Bovenaan het nieuws en als link op de home.' },
    { label: 'Korte tekst voor de home', name: 'kort', widget: 'string', required: false, hint: 'Enkel bij uitgelicht. Bv. "Nieuw reglement voor de recreantencompetitie". Het PK heeft een eigen blok: Vaste pagina\'s → PK.' },
    { label: 'Bericht', name: 'body', widget: 'markdown', buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list', 'quote'], editor_components: ['image'] },
    { label: 'Oud adres', name: 'legacyUrl', widget: 'hidden', required: false },
  ],
};

const https = { pattern: ['^https://\\S+$', 'Volledige link, beginnend met https://'] };
const mailadres = (label: string, name: string) => ({
  label,
  name,
  widget: 'string',
  pattern: ['^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', 'Geen geldig mailadres'],
});

/** Mailadressen, sociale media, sponsors en competitielinks. src/data/site.ts geeft ze door aan de pagina's. */
const instellingenCollectie = {
  name: 'instellingen',
  label: 'Site-instellingen',
  description: 'Mailadressen, sociale media, sponsors en competitielinks. Ze staan in de footer en op meerdere pagina\'s.',
  editor: { preview: false },
  files: [
    {
      label: 'Contact, sponsors en links',
      name: 'site',
      file: 'src/content/instellingen/site.yaml',
      fields: [
        {
          label: 'Mailadressen',
          name: 'mail',
          widget: 'object',
          hint: 'In de footer en op de pagina\'s waar we naar contact verwijzen.',
          fields: [
            mailadres('Secretariaat', 'secretariaat'),
            mailadres('Jeugdcup', 'jeugdcup'),
            mailadres('Recreanten & G-sport', 'recreanten'),
            mailadres('Voorzitter', 'voorzitter'),
          ],
        },
        {
          label: 'Sociale media',
          name: 'social',
          widget: 'list',
          required: false,
          summary: '{{fields.naam}}',
          hint: 'In de footer onder "Volg ons".',
          fields: [
            { label: 'Naam', name: 'naam', widget: 'string', hint: 'Zoals het in de footer komt, bv. "Instagram".' },
            { label: 'Link', name: 'link', widget: 'string', ...https },
          ],
        },
        {
          label: 'Sponsors',
          label_singular: 'sponsor',
          name: 'sponsors',
          widget: 'list',
          required: false,
          summary: '{{fields.naam}}',
          hint: 'Boven de footer, onder "Met steun van". Eén sponsor krijgt een groot logo. Leeg = geen sponsorblok.',
          fields: [
            { label: 'Naam', name: 'naam', widget: 'string' },
            { label: 'Website', name: 'link', widget: 'string', ...https },
            {
              label: 'Logo',
              name: 'logo',
              widget: 'image',
              media_folder: '/src/assets/sponsors',
              public_folder: '../../assets/sponsors',
              choose_url: false,
              hint: 'Png of jpg, minstens 800 px breed.',
            },
          ],
        },
        {
          label: 'Competitie',
          name: 'competitie',
          widget: 'object',
          fields: [
            { label: 'Competitieagenda', name: 'agenda', widget: 'string', ...https },
            { label: 'Uitslagen en standen bij Badminton Vlaanderen', name: 'uitslagen', widget: 'string', ...https },
          ],
        },
      ],
    },
  ],
};

/** Collecties die enkel beheerders zien. */
export const beheerCollecties = async (): Promise<object[]> => [
  nieuwsCollectie,
  await rankingsCollectie(),
  kalenderCollectie,
  paginasCollectie,
  instellingenCollectie,
];

export function cmsConfig({ site, collections }: { site: URL; collections: object[] }) {
  return {
    locale: 'nl',
    backend: {
      name: 'github',
      repo,
      branch: 'main',
      base_url: authUrl,
      auth_endpoint: 'admin/auth/',
      commit_messages: {
        create: 'Nieuw in {{collection}}: {{slug}}',
        update: 'Aangepast in {{collection}}: {{slug}}',
        delete: 'Verwijderd uit {{collection}}: {{slug}}',
        uploadMedia: 'Bestand toegevoegd: {{path}}',
        deleteMedia: 'Bestand verwijderd: {{path}}',
      },
    },
    // `npx decap-server` + `npm run dev` om lokaal te testen zonder GitHub.
    local_backend: true,
    site_url: site.href,
    display_url: site.href,
    logo_url: new URL('icon-512.png', site).href,
    media_folder: 'public/uploads',
    public_folder: '/uploads',
    slug: { encoding: 'ascii', clean_accents: true },
    collections,
  };
}
