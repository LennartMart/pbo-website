/**
 * Namen vergelijken zonder hoofdletters, accenten, spaties of leestekens:
 * "Van Damme", "Vandamme" en "van-damme" worden allemaal "vandamme".
 * Ook in het zoekscript van de ranking (client), dus zonder astro-imports.
 */
export const compact = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Elk woord uit de zoekopdracht moet ergens in de tekst staan: "damme ine" vindt "Ine Van Damme". */
export const woorden = (q: string) => q.split(/\s+/).map(compact).filter(Boolean);
