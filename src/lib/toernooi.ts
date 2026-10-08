/**
 * Wat een jeugdcuphalte en het PK delen: een pagina op tournamentsoftware en een sporthal.
 * Los van jeugdcup.ts, zodat het PK niet van de jeugdcup afhangt.
 */
import { dagMaand, plusDagen, vandaag } from './datum';

/**
 * Toernooi met een pagina op tournamentsoftware en twee data: `inschrijvenTot`, de laatste dag om in te schrijven, en
 * `datum`, de (laatste) speeldag. Het schema maakt `inschrijvenTot` verplicht bij een toernooilink.
 */
export interface Toernooipagina {
  datum: string;
  toernooilink?: string;
  inschrijvenTot?: string;
}

/**
 * De toernooilink is één pagina die meegroeit: tot en met "inschrijven tot" om in te schrijven, daarna tot en met
 * de speeldag voor de loting en de wedstrijden, na de speeldag voor de uitslagen. Zonder inschrijfdatum nooit
 * "Inschrijven": de site belooft niet dat het nog kan. `wie` is voor schermlezers.
 */
export function toernooiLink(t: Toernooipagina, wie: string, nu = vandaag()) {
  if (!t.toernooilink) return undefined;
  const href = t.toernooilink;
  if (t.datum < nu) return { href, label: 'Uitslagen', sr: `van ${wie}`, icon: 'document' } as const;
  if (t.inschrijvenTot && nu <= t.inschrijvenTot && nu < t.datum)
    return { href, label: `Inschrijven tot ${dagMaand(t.inschrijvenTot)}`, sr: `voor ${wie}`, icon: 'inschrijven' } as const;
  return { href, label: 'Wedstrijden', sr: `bij ${wie}`, icon: 'klok' } as const;
}

/** Elke knop die toernooiLink vanaf vandaag nog geeft, met de dagen waarop hij klopt (voor Periode). */
export function toernooiLinks(t: Toernooipagina, wie: string, nu = vandaag()) {
  if (!t.toernooilink) return [];
  const wissels = [t.inschrijvenTot && plusDagen(t.inschrijvenTot, 1), t.datum, plusDagen(t.datum, 1)]
    .filter((d): d is string => !!d && d > nu)
    .sort((a, b) => a.localeCompare(b));
  const fasen = [undefined, ...wissels]
    .map((van) => ({ van, link: toernooiLink(t, wie, van ?? nu)! }))
    .filter((f, i, alle) => i === 0 || f.link.label !== alle[i - 1].link.label);
  return fasen.map((f, i) => ({ ...f, tot: fasen[i + 1] && plusDagen(fasen[i + 1].van!, -1) }));
}

/** Google Maps-route naar het adres. Zonder adres zoeken we op sporthal en `bij` (club of gemeente); zonder sporthal geen link. */
export function routeUrl({ adres, sporthal, bij }: { adres?: string; sporthal?: string; bij: string }) {
  const waar = adres ?? (sporthal && `${sporthal} ${bij}`);
  return waar && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(waar)}`;
}
