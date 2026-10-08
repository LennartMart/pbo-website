/**
 * Decap CMS-configuratie, bij de build weggeschreven als /admin/config.yml en /admin/jeugdcup/config.yml.
 * JSON is geldige YAML, dus Decap leest dit gewoon in.
 *
 * - /admin          beheerders: alles
 * - /admin/jeugdcup gewone users: enkel de jeugdcup-rankings
 *
 * Velden moeten overeenkomen met src/content.config.ts.
 */
import { categorieen, disciplines } from './jeugdcup-labels';
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
    'Na elke jeugdcup: kies het toernooi, de categorie en de discipline, plak de stand uit Excel en klik op Publiceren. Een paar minuten later staat ze op de site.',
  folder: 'src/content/rankings',
  extension: 'yaml',
  format: 'yaml',
  create: true,
  delete: true,
  identifier_field: 'toernooi',
  // Zonder 'fields.': Decap maakt van elke punt in path een streepje.
  path: '{{toernooi}}/{{categorie}}-{{discipline}}',
  summary: '{{toernooi}} · {{categorie}} {{discipline}}',
  sortable_fields: ['toernooi', 'categorie', 'discipline'],
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
    { label: '3. Discipline', name: 'discipline', widget: 'select', options: opties(disciplines) },
    {
      label: '4. Stand plakken',
      name: 'stand',
      widget: 'text',
      hint: 'Selecteer in Excel de kolommen positie, naam, club en punten. Kopieer en plak ze hier. Bij dubbel: "naam / naam" in één kolom, of naam, club, naam, club. Rechts zie je hoe het op de site komt.',
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

const toernooienCollectie = {
  name: 'toernooien',
  label: 'Jeugdcup-kalender',
  label_singular: 'halte',
  description: 'Eén item per jeugdcup. Het seizoen volgt uit de datum (augustus tot juli).',
  folder: 'src/content/toernooien',
  extension: 'yaml',
  format: 'yaml',
  create: true,
  delete: true,
  identifier_field: 'club',
  slug: '{{fields.date}}-{{fields.club}}',
  summary: '{{date}} · {{club}}',
  sortable_fields: ['date', 'club'],
  fields: [
    { label: 'Datum', name: 'date', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'DD-MM-YYYY', time_format: false, picker_utc: true },
    { label: 'Club', name: 'club', widget: 'string', hint: 'Zoals de club zichzelf noemt, bv. "Gentse BC".' },
    { label: 'Sporthal', name: 'hall', widget: 'string', required: false },
    { label: 'Adres', name: 'adres', widget: 'string', required: false, hint: 'Straat, nummer en gemeente, bv. "Driepikkelstraat 30, 9030 Mariakerke". Voor de routelink.' },
    { label: 'Beginuur', name: 'start', widget: 'string', required: false, hint: 'Zoals het op de site komt, bv. "9.00 uur".' },
    { label: 'Inschrijving', name: 'inschrijving', widget: 'string', required: false, hint: 'Volledige link naar het inschrijvingsformulier (https://...).' },
    { label: 'Prijsuitreiking', name: 'prijsuitreiking', widget: 'boolean', required: false, default: false },
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
      ],
    },
    {
      label: 'Competitie',
      name: 'competitie',
      file: 'src/content/paginas/competitie.md',
      fields: [...paginaVelden, tekst],
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
  sortable_fields: ['date', 'title'],
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
    { label: 'Korte tekst voor de home', name: 'kort', widget: 'string', required: false, hint: 'Enkel bij uitgelicht. Bv. "PK op 31 oktober en 1 november in Nevele".' },
    { label: 'Bericht', name: 'body', widget: 'markdown', buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list', 'quote'], editor_components: ['image'] },
    { label: 'Oud adres', name: 'legacyUrl', widget: 'hidden', required: false },
  ],
};

/** Collecties die enkel beheerders zien. */
export const beheerCollecties = async (): Promise<object[]> => [nieuwsCollectie, await rankingsCollectie(), toernooienCollectie, paginasCollectie];

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
