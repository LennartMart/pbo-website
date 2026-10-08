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
  adres?: string;
  start?: string;
  inschrijving?: string;
  prijsuitreiking?: boolean;
}

/** Google Maps-route. Zonder adres zoeken we op sporthal en club; zonder sporthal geen link. */
export function routeUrl(t: Toernooi) {
  const waar = t.adres ?? (t.hall && `${t.hall} ${t.club}`);
  return waar && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(waar)}`;
}

/**
 * De echte site (www.badminton-pbo.be) toont nooit voorbeelddata met verzonnen namen.
 * In `npm run dev` en op testversies (GitHub Pages, testsubdomein) staan ze er wel, met een melding.
 */
const productie = !import.meta.env.DEV && new URL(import.meta.env.SITE ?? 'https://www.badminton-pbo.be').hostname === 'www.badminton-pbo.be';

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

let gewaarschuwd = false;

export async function alleStanden(): Promise<Stand[]> {
  const toernooien = new Map((await alleToernooien()).map((t) => [t.id, t]));
  let items: CollectionEntry<'rankings'>[] = await getCollection('rankings');
  if (productie && items.some((r) => r.data.voorbeeld)) {
    if (!gewaarschuwd) console.warn('[jeugdcup] Voorbeeldstanden niet gepubliceerd: build voor www.badminton-pbo.be.');
    gewaarschuwd = true;
    items = items.filter((r) => !r.data.voorbeeld);
  }
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
  // Per jaar en per categorie-discipline alle standen, oudste eerst.
  const jaren = new Map<number, Map<string, Stand[]>>();
  for (const s of await alleStanden()) {
    const jaar = Number(s.toernooi.date.slice(0, 4));
    const per = jaren.get(jaar) ?? new Map<string, Stand[]>();
    const key = `${s.categorie}-${s.discipline}`;
    per.set(key, [...(per.get(key) ?? []), s].sort((a, b) => a.toernooi.date.localeCompare(b.toernooi.date)));
    jaren.set(jaar, per);
  }
  return [...jaren.entries()]
    .sort(([a], [b]) => b - a)
    .map(([jaar, reeksen]) => {
      const per = new Map([...reeksen].map(([k, lijst]) => [k, lijst.at(-1)!]));
      const vorige = new Map([...reeksen].filter(([, lijst]) => lijst.length > 1).map(([k, lijst]) => [k, lijst.at(-2)!]));
      const standen = [...per.values()];
      const laatste = standen.reduce((a, b) => (b.toernooi.date > a.toernooi.date ? b : a));
      return { jaar, per, vorige, laatste: laatste.toernooi, voorbeeld: standen.some((s) => s.voorbeeld) };
    });
}

/** Plaatsen gestegen (positief) of gedaald (negatief) sinds de vorige stand, of 'nieuw'. */
export type Beweging = number | 'nieuw';

const rijSleutel = (r: Rij) =>
  r.spelers
    .map((p) => `${p.naam}@${p.club ?? ''}`.toLowerCase())
    .sort((a, b) => a.localeCompare(b))
    .join('|');

/** Beweging per rij (zelfde volgorde als `stand.rijen`). Zonder vorige stand: geen beweging. */
export function bewegingen(stand: Stand, vorig?: Stand): (Beweging | undefined)[] {
  if (!vorig) return stand.rijen.map(() => undefined);
  const eerder = new Map<string, number>();
  for (const r of vorig.rijen) if (!eerder.has(rijSleutel(r))) eerder.set(rijSleutel(r), r.pos);
  return stand.rijen.map((r) => {
    const pos = eerder.get(rijSleutel(r));
    return pos === undefined ? 'nieuw' : pos - r.pos;
  });
}

/** Laatst gepubliceerde stand, voor de home en de jeugdcuptourpagina. */
export async function laatsteRanking() {
  const [recent] = await rankingPerJaar();
  return recent ? { jaar: recent.jaar, na: recent.laatste.club, datum: recent.laatste.date } : undefined;
}
