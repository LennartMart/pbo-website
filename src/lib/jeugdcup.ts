import { getCollection, type CollectionEntry } from 'astro:content';
import { vandaag } from './datum';
import { leesStand, type Rij } from './stand';

export * from './jeugdcup-labels';
import type { CategorieId, DisciplineId } from './jeugdcup-labels';

/** Seizoen loopt van augustus tot juli: 2026-09-26 hoort bij 2026-2027. */
export const seizoenVan = (iso: string) => {
  const j = Number(iso.slice(0, 4));
  return Number(iso.slice(5, 7)) >= 8 ? `${j}-${j + 1}` : `${j - 1}-${j}`;
};

export interface Toernooi {
  id: string;
  date: string;
  club: string;
  hall?: string;
  prijsuitreiking?: boolean;
}

export async function alleToernooien(): Promise<Toernooi[]> {
  const items = await getCollection('toernooien');
  return items.map((t) => ({ id: t.id, ...t.data })).sort((a, b) => a.date.localeCompare(b.date));
}

/** Seizoen van vandaag. Na de laatste halte schuift het door naar het volgende seizoen zodra dat data heeft. */
export async function huidigSeizoen() {
  const nu = vandaag();
  const toernooien = await alleToernooien();
  const volgende = toernooien.find((t) => t.date >= nu);
  return volgende ? seizoenVan(volgende.date) : seizoenVan(nu);
}

export async function komende(vanaf = vandaag()) {
  return (await alleToernooien()).filter((t) => t.date >= vanaf);
}

export interface Stand {
  id: string;
  toernooi: Toernooi;
  categorie: CategorieId;
  discipline: DisciplineId;
  rijen: Rij[];
  pdf?: string;
  voorbeeld: boolean;
}

export async function alleStanden(): Promise<Stand[]> {
  const toernooien = new Map((await alleToernooien()).map((t) => [t.id, t]));
  const items: CollectionEntry<'rankings'>[] = await getCollection('rankings');
  return items.map((r) => {
    const toernooi = toernooien.get(r.data.toernooi.id);
    if (!toernooi) throw new Error(`Ranking ${r.id}: toernooi "${r.data.toernooi.id}" bestaat niet in src/content/toernooien/.`);
    return {
      id: r.id,
      toernooi,
      categorie: r.data.categorie,
      discipline: r.data.discipline,
      rijen: leesStand(r.data.stand),
      pdf: r.data.pdf,
      voorbeeld: r.data.voorbeeld,
    };
  });
}

/**
 * Stand per kalenderjaar: per categorie en discipline de stand van het laatste toernooi in dat jaar.
 * In Excel is de tussenstand al opgeteld; de site telt niets op.
 */
export async function rankingPerJaar() {
  const jaren = new Map<number, Map<string, Stand>>();
  for (const s of await alleStanden()) {
    const jaar = Number(s.toernooi.date.slice(0, 4));
    const per = jaren.get(jaar) ?? new Map<string, Stand>();
    const key = `${s.categorie}-${s.discipline}`;
    const bestaand = per.get(key);
    if (!bestaand || bestaand.toernooi.date < s.toernooi.date) per.set(key, s);
    jaren.set(jaar, per);
  }
  return [...jaren.entries()]
    .sort(([a], [b]) => b - a)
    .map(([jaar, per]) => {
      const standen = [...per.values()];
      const laatste = standen.reduce((a, b) => (b.toernooi.date > a.toernooi.date ? b : a));
      return { jaar, per, laatste: laatste.toernooi, voorbeeld: standen.some((s) => s.voorbeeld) };
    });
}

/** Laatst gepubliceerde stand, voor de home en de jeugdcuptourpagina. */
export async function laatsteRanking() {
  const [recent] = await rankingPerJaar();
  return recent ? { jaar: recent.jaar, na: recent.laatste.club } : undefined;
}
