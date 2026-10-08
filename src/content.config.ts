import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** YAML leest 2026-09-26 als datum; Decap schrijft soms een string. Altijd terug naar YYYY-MM-DD. */
const isoDatum = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}/), z.date()])
  .transform((d) => (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)));

const toernooien = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/toernooien' }),
  schema: z.object({
    date: isoDatum,
    club: z.string(),
    hall: z.string().optional(),
    /** Straat en gemeente, voor de routelink. Zonder adres zoekt de link op sporthal en club. */
    adres: z.string().optional(),
    /** Beginuur zoals het op de site komt, bv. "9.00 uur". */
    start: z.string().optional(),
    /** Link naar het inschrijvingsformulier van deze halte. */
    inschrijving: z.url().optional(),
    prijsuitreiking: z.boolean().optional(),
  }),
});

const categorie = z.enum(['minibad', 'u11', 'u13', 'u15', 'u17-u19']);

const rankings = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/rankings' }),
  schema: z.object({
    toernooi: reference('toernooien'),
    categorie,
    geslacht: z.enum(['jongens', 'meisjes']),
    stand: z.string(),
    pdf: z.string().optional(),
    /** Testdata: de ranking toont dan een melding. Op www.badminton-pbo.be verschijnt ze niet. */
    voorbeeld: z.boolean().default(false),
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
    /** Bovenaan het nieuwsoverzicht en als link in de hero van de home. */
    uitgelicht: z.boolean().default(false),
    /** Korte tekst voor de link op de home, bv. "PK op 31 oktober en 1 november in Nevele". */
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

export const collections = { toernooien, rankings, paginas, nieuws, instellingen };
