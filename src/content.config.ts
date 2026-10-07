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
    prijsuitreiking: z.boolean().optional(),
  }),
});

const rankings = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/rankings' }),
  schema: z.object({
    toernooi: reference('toernooien'),
    categorie: z.enum(['minibad', 'u11', 'u13', 'u15', 'u17-u19']),
    discipline: z.enum(['enkel', 'dubbel', 'gemengd']),
    stand: z.string(),
    pdf: z.string().optional(),
    /** Testdata: de ranking toont dan een melding. */
    voorbeeld: z.boolean().default(false),
  }),
});

// Zonder bestand toont de site "Volgt binnenkort".
const document = z.object({ titel: z.string(), tekst: z.string().optional(), bestand: z.string().optional() });

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

export const collections = { toernooien, rankings, paginas, nieuws };
