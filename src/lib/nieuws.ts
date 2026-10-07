import { getCollection, type CollectionEntry } from 'astro:content';

export type Bericht = CollectionEntry<'nieuws'>;

export * from './nieuws-labels';

/** Alle berichten, nieuwste eerst. */
export async function alleBerichten(): Promise<Bericht[]> {
  return (await getCollection('nieuws')).sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

/** Uitgelicht bericht: het nieuwste met `uitgelicht: true`, anders gewoon het nieuwste. */
export function kiesUitgelicht(berichten: Bericht[]) {
  return berichten.find((b) => b.data.uitgelicht) ?? berichten[0];
}

export const jaarVan = (b: Bericht) => Number(b.data.date.slice(0, 4));

/** Gaat het bericht over een jeugdcupstand? Dan toont het artikel een link naar de ranking. */
export const overRanking = (b: Bericht) => b.data.category === 'jeugd' && /ranking|stand/i.test(b.data.title);
