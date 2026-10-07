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

export const collections = { toernooien, rankings };
