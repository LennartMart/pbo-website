import { getCollection, getEntry } from 'astro:content';
import { dag, maand, plusDagen, vandaag } from './datum';
import { leesStand, type Rij } from './stand';

export * from './jeugdcup-labels';
import type { CategorieId, GeslachtId } from './jeugdcup-labels';

/** Geboortejaren uit Vaste pagina's → Jeugdcuptour, ingevuld voor één kalenderjaar. */
const indeling = (await getEntry('paginas', 'jeugdcuptour'))?.data.geboortejaren;
if (!indeling) throw new Error('Geboortejaren ontbreken in src/content/paginas/jeugdcuptour.md');

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

export interface Toernooi {
  id: string;
  date: string;
  club: string;
  hall?: string;
  adres?: string;
  start?: string;
  toernooilink?: string;
  inschrijvenTot?: string;
  prijsuitreiking?: boolean;
}

/** Google Maps-route. Zonder adres zoeken we op sporthal en club; zonder sporthal geen link. */
export function routeUrl(t: Toernooi) {
  const waar = t.adres ?? (t.hall && `${t.hall} ${t.club}`);
  return waar && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(waar)}`;
}

/**
 * De toernooilink is één pagina die meegroeit: tot "inschrijven tot" om in te schrijven, daarna tot en met
 * de speeldag voor de loting en de wedstrijden, na de halte voor de uitslagen.
 */
export function toernooiLink(t: Toernooi, nu = vandaag()) {
  if (!t.toernooilink) return undefined;
  const href = t.toernooilink;
  if (t.date < nu) return { href, label: 'Uitslagen', sr: `van ${t.club}`, icon: 'document' } as const;
  if (t.date > nu && (!t.inschrijvenTot || nu <= t.inschrijvenTot)) {
    const tot = t.inschrijvenTot ? ` tot ${dag(t.inschrijvenTot)} ${maand(t.inschrijvenTot)}` : '';
    return { href, label: `Inschrijven${tot}`, sr: `voor ${t.club}`, icon: 'inschrijven' } as const;
  }
  return { href, label: 'Wedstrijden', sr: `bij ${t.club}`, icon: 'klok' } as const;
}

/** Elke knop die toernooiLink vanaf vandaag nog geeft, met de dagen waarop hij klopt (voor Periode). */
export function toernooiLinks(t: Toernooi, nu = vandaag()) {
  if (!t.toernooilink) return [];
  const wissels = [t.inschrijvenTot && plusDagen(t.inschrijvenTot, 1), t.date, plusDagen(t.date, 1)]
    .filter((d): d is string => !!d && d > nu)
    .sort((a, b) => a.localeCompare(b));
  const fasen = [undefined, ...wissels]
    .map((van) => ({ van, link: toernooiLink(t, van ?? nu)! }))
    .filter((f, i, alle) => i === 0 || f.link.label !== alle[i - 1].link.label);
  return fasen.map((f, i) => ({ ...f, tot: fasen[i + 1] && plusDagen(fasen[i + 1].van!, -1) }));
}

/**
 * Een halte op de lijn door de tijd: later tot en met de vorige halte, dan de volgende tot en met haar speeldag,
 * daarna gespeeld. Enkel wat vanaf vandaag nog kan, met de dagen voor Periode.
 */
export function statussen(t: Toernooi, vorige: Toernooi | undefined, nu = vandaag()) {
  const fasen: { status: 'later' | 'volgende' | 'gespeeld'; van?: string; tot?: string }[] = [
    ...(vorige ? [{ status: 'later', tot: vorige.date } as const] : []),
    { status: 'volgende', van: vorige && plusDagen(vorige.date, 1), tot: t.date },
    { status: 'gespeeld', van: plusDagen(t.date, 1) },
  ];
  // Twee haltes op dezelfde dag: de tweede is nooit de volgende.
  return fasen.filter((f) => !(f.tot && f.tot < nu) && !(f.van && f.tot && f.van > f.tot));
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
    .map((h) => ({ id: `${h.date}-${slug(h.club)}`, ...h }))
    .sort((a, b) => a.date.localeCompare(b.date));
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
  toernooi: Toernooi;
  categorie: CategorieId;
  geslacht: GeslachtId;
  rijen: Rij[];
  pdf?: string;
}

export async function alleStanden(): Promise<Stand[]> {
  const haltes = await alleToernooien();
  const opId = new Map(haltes.map((t) => [t.id, t]));
  const opDatum = new Map(haltes.map((t) => [t.date, t]));
  return (await getCollection('rankings')).map((r) => {
    // Op datum als terugval: een verbeterde clubnaam verandert het id van de halte.
    const toernooi = opId.get(r.data.toernooi) ?? opDatum.get(r.data.toernooi.slice(0, 10));
    if (!toernooi) throw new Error(`Stand ${r.id}: halte "${r.data.toernooi}" staat niet (meer) in de kalender (src/content/kalender/).`);
    return { toernooi, categorie: r.data.categorie, geslacht: r.data.geslacht, rijen: leesStand(r.data.stand), pdf: r.data.pdf };
  });
}

/**
 * Stand per kalenderjaar: per categorie, jongens en meisjes apart, de stand van het laatste toernooi in dat jaar.
 * In Excel is de tussenstand al opgeteld; de site telt niets op.
 */
export async function rankingPerJaar() {
  const jaren = new Map<number, Map<string, Stand>>();
  for (const s of await alleStanden()) {
    const jaar = Number(s.toernooi.date.slice(0, 4));
    const per = jaren.get(jaar) ?? new Map<string, Stand>();
    const key = `${s.categorie}-${s.geslacht}`;
    const eerder = per.get(key);
    if (!eerder || s.toernooi.date > eerder.toernooi.date) per.set(key, s);
    jaren.set(jaar, per);
  }
  return [...jaren.entries()]
    .sort(([a], [b]) => b - a)
    .map(([jaar, per]) => {
      const laatste = [...per.values()].reduce((a, b) => (b.toernooi.date > a.toernooi.date ? b : a)).toernooi;
      return { jaar, per, laatste };
    });
}

/** Laatst gepubliceerde stand, voor de home en de jeugdcuptourpagina. */
export async function laatsteRanking() {
  const [recent] = await rankingPerJaar();
  return recent ? { jaar: recent.jaar, na: recent.laatste.club, datum: recent.laatste.date } : undefined;
}
