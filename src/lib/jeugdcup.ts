import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { dagMaand, plusDagen, vandaag, weekdagDagMaand } from './datum';
import { leesStand, type Rij } from './stand';

export * from './jeugdcup-labels';
import type { CategorieId, GeslachtId } from './jeugdcup-labels';

/** Vaste pagina Jeugdcuptour: de geboortejaren (ingevuld voor één kalenderjaar) en het archief met eindstanden. */
const jeugdcuptour = (await getEntry('paginas', 'jeugdcuptour'))?.data;
const indeling = jeugdcuptour?.geboortejaren;
if (!jeugdcuptour || !indeling) throw new Error('Geboortejaren ontbreken in src/content/paginas/jeugdcuptour.md');

/** Eindstanden van vroeger (pdf), nieuwste eerst. */
export const archief = jeugdcuptour.archief;

/** Andere jaren schuiven mee: U11 is in 2026 geboren in 2016, in 2027 in 2017. */
const jarenIn = (id: CategorieId, jaar: number) => {
  const { van, tot } = indeling[id];
  const verschil = jaar - indeling.jaar;
  return { van: van + verschil, tot: tot === undefined ? undefined : tot + verschil };
};

/** "2017 of later", "2016", "2014 en 2015", "2008 tot en met 2011". */
export function geboortejaren(id: CategorieId, jaar: number) {
  const { van, tot } = jarenIn(id, jaar);
  if (tot === undefined) return `${van} of later`;
  if (tot === van) return `${van}`;
  return tot === van + 1 ? `${van} en ${tot}` : `${van} tot en met ${tot}`;
}

/** Korte vorm voor op een knop: "2017+", "2016", "2014–15", "2008–11". */
export function geboortejarenKort(id: CategorieId, jaar: number) {
  const { van, tot } = jarenIn(id, jaar);
  if (tot === undefined) return `${van}+`;
  return tot === van ? `${van}` : `${van}–${String(tot).slice(2)}`;
}

/** Seizoen loopt van augustus tot juli: 2026-09-26 hoort bij 2026-2027. */
export const seizoenVan = (iso: string) => {
  const j = Number(iso.slice(0, 4));
  return Number(iso.slice(5, 7)) >= 8 ? `${j}-${j + 1}` : `${j - 1}-${j}`;
};

/** Eén halte uit de kalender, met id <datum>-<club>. */
export type Toernooi = CollectionEntry<'kalender'>['data']['haltes'][number] & { id: string };

/** De ranking loopt per kalenderjaar, niet per seizoen: een halte telt voor het jaar van haar datum. */
export const rankingJaar = (t: Toernooi) => Number(t.datum.slice(0, 4));

/**
 * Een halte door de tijd (lijnplan op de home, kalender): later tot en met de vorige halte, dan de volgende tot en met
 * haar speeldag, daarna gespeeld. Enkel wat vanaf vandaag nog kan, met de dagen voor Periode.
 */
export function statussen(t: Toernooi, alle: Toernooi[], nu = vandaag()) {
  const vorige = alle[alle.indexOf(t) - 1];
  const fasen: { status: 'later' | 'volgende' | 'gespeeld'; van?: string; tot?: string }[] = [
    ...(vorige ? [{ status: 'later', tot: vorige.datum } as const] : []),
    { status: 'volgende', van: vorige && plusDagen(vorige.datum, 1), tot: t.datum },
    { status: 'gespeeld', van: plusDagen(t.datum, 1) },
  ];
  // Twee haltes op dezelfde dag: de tweede is nooit de volgende.
  return fasen.filter((f) => !(f.tot && f.tot < nu) && !(f.van && f.tot && f.van > f.tot));
}

/** Halte met een toernooilink en een inschrijfdatum: inschrijven kan tot en met `inschrijvenTot`. */
export type MetInschrijving = Toernooi & { toernooilink: string; inschrijvenTot: string };
export const metInschrijving = (t: Toernooi): t is MetInschrijving => !!t.toernooilink && !!t.inschrijvenTot;

/**
 * De tijdlijn voor een statische pagina die ook moet kloppen als er een tijd geen build is. Elke halte is de volgende
 * vanaf de dag na de vorige halte tot en met haar speeldag; na de laatste is er geen. Per moment (van, tot: voor Periode)
 * de volgende halte, haar seizoen met alle haltes en de haltes die daarna nog komen. Na de laatste halte: het seizoen
 * dat net gespeeld is. `inschrijven`: de latere haltes waarvoor je in dat moment nog kan inschrijven (elk tot haar
 * `inschrijvenTot`); de volgende halte zelf heeft haar eigen knop.
 */
export function tijdlijn(toernooien: Toernooi[], nu = vandaag()) {
  const komend = toernooien.filter((t) => t.datum >= nu);
  return [...komend, undefined].map((volgende, i) => {
    const van = i > 0 ? plusDagen(komend[i - 1].datum, 1) : undefined;
    const ijkpunt = volgende ?? toernooien.at(-1);
    const seizoen = ijkpunt && seizoenVan(ijkpunt.datum);
    const haltes = toernooien.filter((t) => seizoenVan(t.datum) === seizoen);
    const later = volgende ? toernooien.filter((t) => t !== volgende && t.datum >= volgende.datum) : [];
    return {
      van,
      tot: volgende?.datum,
      volgende,
      seizoen,
      haltes,
      daarna: volgende ? haltes.slice(haltes.indexOf(volgende) + 1) : [],
      inschrijven: later.filter(metInschrijving).filter((t) => t.inschrijvenTot >= (van ?? nu)),
    };
  });
}

/** "BC De Mintons" → "bc-de-mintons". */
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Alle haltes uit src/content/kalender/<seizoen>.yaml, op datum. Id: <datum>-<club>, bv. 2026-09-26-bc-de-mintons. */
export async function alleToernooien(): Promise<Toernooi[]> {
  const seizoenen = await getCollection('kalender');
  return seizoenen
    .flatMap((s) => s.data.haltes)
    .map((h) => ({ id: `${h.datum}-${slug(h.club)}`, ...h }))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Seizoen van vandaag. Na de laatste halte schuift het door naar het volgende seizoen zodra dat data heeft. */
export async function huidigSeizoen() {
  const [volgende] = await komende();
  return seizoenVan(volgende?.datum ?? vandaag());
}

export async function komende(vanaf = vandaag()) {
  return (await alleToernooien()).filter((t) => t.datum >= vanaf);
}

/** "Volgende halte: Gentse BC op zaterdag 11 oktober." */
export const volgendeHalteZin = (t: Toernooi) => `Volgende halte: ${t.club} op ${weekdagDagMaand(t.datum)}.`;

export interface Stand {
  toernooi: Toernooi;
  categorie: CategorieId;
  geslacht: GeslachtId;
  rijen: Rij[];
  pdf?: string;
}

/** Sleutel van een stand binnen een jaar: "u13-jongens". */
export const standSleutel = (categorie: string, geslacht: string) => `${categorie}-${geslacht}`;

export async function alleStanden(): Promise<Stand[]> {
  const haltes = await alleToernooien();
  const opId = new Map(haltes.map((t) => [t.id, t]));
  const opDatum = new Map(haltes.map((t) => [t.datum, t]));
  return (await getCollection('rankings')).map((r) => {
    // Op datum als terugval: een verbeterde clubnaam verandert het id van de halte.
    const toernooi = opId.get(r.data.toernooi) ?? opDatum.get(r.data.toernooi.slice(0, 10));
    if (!toernooi) throw new Error(`Stand ${r.id}: halte "${r.data.toernooi}" staat niet (meer) in de kalender (src/content/kalender/).`);
    return { toernooi, categorie: r.data.categorie, geslacht: r.data.geslacht, rijen: leesStand(r.data.stand), pdf: r.data.pdf };
  });
}

/**
 * Stand per kalenderjaar, nieuwste eerst: per categorie, jongens en meisjes apart, de stand van het laatste toernooi
 * in dat jaar. In Excel is de tussenstand al opgeteld; de site telt niets op.
 */
export async function rankingPerJaar() {
  const jaren = new Map<number, Map<string, Stand>>();
  for (const s of await alleStanden()) {
    const per = jaren.get(rankingJaar(s.toernooi)) ?? new Map<string, Stand>();
    const sleutel = standSleutel(s.categorie, s.geslacht);
    const eerder = per.get(sleutel);
    if (!eerder || s.toernooi.datum > eerder.toernooi.datum) per.set(sleutel, s);
    jaren.set(rankingJaar(s.toernooi), per);
  }
  return [...jaren.entries()]
    .sort(([a], [b]) => b - a)
    .map(([jaar, per]) => {
      const laatste = [...per.values()].reduce((a, b) => (b.toernooi.datum > a.toernooi.datum ? b : a)).toernooi;
      return { jaar, per, laatste };
    });
}

/** Laatst gepubliceerde stand: het jaar en de halte waarna ze berekend is. */
export async function laatsteRanking() {
  return (await rankingPerJaar()).at(0);
}

/** "Stand na Gentse BC, zaterdag 11 oktober." */
export const standNaZin = (t: Toernooi) => `Stand na ${t.club}, ${weekdagDagMaand(t.datum)}.`;

/**
 * Wanneer de volgende stand komt. Ligt de volgende halte in een ander kalenderjaar dan de laatste stand (`jaar`),
 * dan begint daar een nieuwe ranking. Zonder stand: de eerste.
 */
export function volgendeStandZin(volgende: Toernooi, jaar?: number) {
  const waar = `${volgende.club} op ${dagMaand(volgende.datum)}`;
  if (jaar === undefined) return `De eerste stand komt na ${waar}.`;
  if (rankingJaar(volgende) !== jaar) return `De ranking ${rankingJaar(volgende)} begint bij ${waar}.`;
  return `De volgende stand komt na ${waar}.`;
}
