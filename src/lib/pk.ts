import { getEntry, render } from 'astro:content';
import { dag, maand, weekdag } from './datum';
import { routeUrl } from './jeugdcup';

/** "zaterdag 31 oktober" */
const opDag = (iso: string) => `${weekdag(iso).toLowerCase()} ${dag(iso)} ${maand(iso)}`;

/** Provinciaal kampioenschap uit src/content/pk/pk.md, met de zinnen en knoppen die de home en /pk delen. */
export async function pk() {
  const entry = await getEntry('pk', 'pk');
  if (!entry) throw new Error('src/content/pk/pk.md ontbreekt.');
  const { Content } = await render(entry);
  const d = entry.data;
  const wanneer = d.datumTot ? `${opDag(d.datum)} en ${opDag(d.datumTot)}` : opDag(d.datum);
  const door = d.organisatie ? `, georganiseerd door ${d.organisatie}` : '';
  const zin = `${wanneer.charAt(0).toUpperCase()}${wanneer.slice(1)} in ${d.plaats}${door}.`;
  // Voor ToernooiKnop: de knop volgt de laatste speeldag (inschrijven, dan wedstrijden, na het PK uitslagen).
  const toernooi = { id: 'pk', date: d.datumTot ?? d.datum, club: 'het PK', toernooilink: d.toernooilink, inschrijvenTot: d.inschrijvenTot };
  const route = routeUrl({ id: 'pk', date: d.datum, club: d.plaats, hall: d.sporthal, adres: d.adres });
  return { ...d, Content, titel: `${d.naam} ${d.datum.slice(0, 4)}`, wanneer, zin, toernooi, route };
}
