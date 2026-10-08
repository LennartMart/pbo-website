import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** YAML leest 2026-09-26 als datum; Decap schrijft soms een string. Altijd terug naar YYYY-MM-DD. */
const isoDatum = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}/), z.date()])
  .transform((d) => (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)));

/** Decap schrijft een leeggemaakt veld als ''. */
const leeg = (v: unknown) => (v === '' || v === null ? undefined : v);

/** Eén halte van de jeugdcuptour. Het id (<datum>-<club>) leidt src/lib/jeugdcup.ts af. */
const halte = z.object({
  date: isoDatum,
  club: z.string(),
  hall: z.preprocess(leeg, z.string().optional()),
  /** Straat en gemeente, voor de routelink. Zonder adres zoekt de link op sporthal en club. */
  adres: z.preprocess(leeg, z.string().optional()),
  /** Beginuur zoals het op de site komt, bv. "9.00 uur". */
  start: z.preprocess(leeg, z.string().optional()),
  /** Toernooipagina (tournamentsoftware): eerst inschrijven, dan wedstrijden, na de halte uitslagen. */
  toernooilink: z.preprocess(leeg, z.url().optional()),
  /** Laatste dag om in te schrijven. Daarna heet de toernooilink "Wedstrijden". */
  inschrijvenTot: z.preprocess(leeg, isoDatum.optional()),
  prijsuitreiking: z.boolean().optional(),
});

/** Eén bestand per seizoen met een lijst haltes, zodat beheerders ze in bulk toevoegen en schrappen. */
const kalender = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/kalender' }),
  schema: z.object({ seizoen: z.string(), haltes: z.array(halte).default([]) }),
});

/** Provinciaal kampioenschap: één bestand dat beheerders elk jaar bijwerken. Met `tonen` staat het op de home. */
const pk = defineCollection({
  loader: glob({ pattern: 'pk.md', base: './src/content/pk' }),
  schema: z.object({
    tonen: z.boolean().default(false),
    /** Zonder naam: "Provinciaal kampioenschap". Het jaar komt uit de datum. */
    naam: z.preprocess(leeg, z.string().default('Provinciaal kampioenschap')),
    datum: isoDatum,
    /** Tweede speeldag; leeg bij een PK van één dag. */
    datumTot: z.preprocess(leeg, isoDatum.optional()),
    plaats: z.string(),
    sporthal: z.preprocess(leeg, z.string().optional()),
    adres: z.preprocess(leeg, z.string().optional()),
    organisatie: z.preprocess(leeg, z.string().optional()),
    /** Zelfde toernooipagina als bij een halte: inschrijven, wedstrijden, uitslagen. */
    toernooilink: z.preprocess(leeg, z.url().optional()),
    inschrijvenTot: z.preprocess(leeg, isoDatum.optional()),
    affiche: z.preprocess(leeg, z.string().optional()),
  }),
});

const categorie = z.enum(['minibad', 'u11', 'u13', 'u15', 'u17-u19']);

const rankings = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/rankings' }),
  schema: z.object({
    /** Id van de halte (<datum>-<club>). Vindt de site dat id niet, dan zoekt ze op de datum. */
    toernooi: z.string(),
    categorie,
    geslacht: z.enum(['jongens', 'meisjes']),
    stand: z.string(),
    pdf: z.string().optional(),
  }),
});

// Zonder bestand toont de site "Nog niet online".
const document = z.object({ titel: z.string(), tekst: z.string().optional(), bestand: z.string().optional() });

/** Geboortejaren van één categorie. Zonder `tot`: "of later". Decap schrijft een leeg getalveld als ''. */
const jaren = z
  .object({ van: z.number().int(), tot: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.number().int().optional()) })
  .refine((j) => j.tot === undefined || j.tot >= j.van, '"Tot en met" ligt voor "van"');

/**
 * Vaste pagina's: titel, intro en de lopende tekst (Markdown) plus de lijsten die beheerders zelf aanpassen.
 * De opmaak rond die inhoud (kaarten, zijbalken) blijft in src/pages/.
 */
const paginas = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/paginas' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string(),
      description: z.string(),
      documenten: z.array(document).default([]),
      // bestuur
      bestuurders: z.array(z.object({ naam: z.string(), rol: z.string(), foto: image().optional() })).default([]),
      medewerkers: z.array(z.object({ naam: z.string(), rol: z.string(), vacant: z.boolean().default(false) })).default([]),
      bijdragen: z.array(z.object({ type: z.string(), perSpeler: z.string(), minimum: z.string() })).default([]),
      // jeugd
      trainers: z.array(z.object({ naam: z.string(), diploma: z.string() })).default([]),
      // jeugdcuptour
      archief: z.array(z.object({ label: z.string(), bestand: z.string() })).default([]),
      /** Ingevuld voor één kalenderjaar; src/lib/jeugdcup.ts schuift ze op naar andere jaren. */
      geboortejaren: z
        .object({ jaar: z.number().int(), minibad: jaren, u11: jaren, u13: jaren, u15: jaren, 'u17-u19': jaren })
        .optional(),
      // vacatures
      vacatures: z.array(z.object({ titel: z.string(), tekst: z.string() })).default([]),
    }),
});

/** Nieuws. Berichten uit WordPress hebben een legacyUrl (oude adres, voor redirects). */
const nieuws = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/nieuws' }),
  schema: z.object({
    title: z.string(),
    date: isoDatum,
    category: z.enum(['jeugd', 'selectie', 'evenement', 'competitie', 'recreanten', 'algemeen']),
    excerpt: z.string(),
    /** Bovenaan het nieuwsoverzicht en de home: blok onder de volgende jeugdcuphalte, of de hero als er geen volgende halte is. */
    uitgelicht: z.boolean().default(false),
    /** Kortere titel voor de home, bv. "Nieuw reglement voor de recreantencompetitie". Het PK heeft een eigen blok. */
    kort: z.string().optional(),
    legacyUrl: z.string().optional(),
  }),
});

const https = z.url({ protocol: /^https$/ });

/** Eén bestand (site.yaml): mailadressen, sociale media, sponsors en competitielinks. Gelezen via src/data/site.ts. */
const instellingen = defineCollection({
  loader: glob({ pattern: 'site.yaml', base: './src/content/instellingen' }),
  schema: ({ image }) =>
    z.object({
      mail: z.object({ secretariaat: z.email(), jeugdcup: z.email(), recreanten: z.email(), voorzitter: z.email() }),
      social: z.array(z.object({ naam: z.string(), link: https })).default([]),
      sponsors: z.array(z.object({ naam: z.string(), link: https, logo: image() })).default([]),
      competitie: z.object({ agenda: https, uitslagen: https }),
    }),
});

export const collections = { kalender, rankings, paginas, pk, nieuws, instellingen };
