import { getEntry } from 'astro:content';

/** Hoofdmenu. Vacatures staat onder Bestuur en in de footer. */
export const nav = [
  { href: '/jeugd/jeugdcuptour', label: 'Jeugdcuptour' },
  { href: '/jeugd', label: 'Jeugd' },
  { href: '/competitie', label: 'Competitie' },
  { href: '/recreanten', label: 'Recreanten & G-sport' },
  { href: '/nieuws', label: 'Nieuws' },
  { href: '/bestuur', label: 'Bestuur' },
];

/**
 * Mailadressen, sociale media, sponsors en competitielinks. Beheerders passen ze aan in /admin → Site-instellingen
 * (src/content/instellingen/site.yaml).
 */
const instellingen = await getEntry('instellingen', 'site');
if (!instellingen) throw new Error('src/content/instellingen/site.yaml ontbreekt');

export const { mail, social, sponsors } = instellingen.data;

/** Enkel de agenda van de PBO-competitie-app is nog in gebruik. */
export const competitieAgenda = instellingen.data.competitie.agenda;

export const badmintonVlaanderen = {
  competitie: instellingen.data.competitie.uitslagen,
  ipjo: 'https://badminton.vlaanderen/ipjo/',
};

/** Google Calendar met alle PBO-agenda's (zelfde bronnen als op de oude site). */
export const pboKalenderEmbed =
  'https://calendar.google.com/calendar/embed?hl=nl&showTitle=0&showPrint=0&wkst=2&mode=AGENDA&bgcolor=%23FFFFFF&ctz=Europe%2FBrussels' +
  '&src=secretariaat%40badminton-pbo.be&color=%23125A12' +
  '&src=6367d5g1ouq5he6738vioge1ts%40group.calendar.google.com&color=%23125A12' +
  '&src=a9t5rbp802rrm6bdkcnlk029t4%40group.calendar.google.com&color=%23875509' +
  '&src=1tsu8lkr5d5ig7g0bbe1tkois0%40group.calendar.google.com&color=%232F6309' +
  '&src=ooa4n16eq4b7upt2tms390it58%40group.calendar.google.com&color=%230F4B38' +
  '&src=72sqhmh4bv3fj5stfl6lpfc35c%40group.calendar.google.com&color=%23B1365F' +
  '&src=5cmkfm49n7odipgt0k4ptt4h30%40group.calendar.google.com&color=%23875509' +
  '&src=if54mbm2lqsmo3md4006fi12jc%40group.calendar.google.com&color=%235229A3' +
  '&src=kq5io41csv5h92vvqbe9id1i1g%40group.calendar.google.com&color=%238D6F47';
