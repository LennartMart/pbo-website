// Voorlopige bron voor fase 1. In fase 2 verhuist dit naar src/content/toernooien/2026-2027.yaml.
import { vandaag } from '../lib/datum';

export interface Toernooi {
  id: string;
  date: string;
  club: string;
  hall?: string;
  prijsuitreiking?: boolean;
}

export const seizoen = '2026-2027';

export const toernooien: Toernooi[] = [
  { id: 'de-mintons', date: '2026-09-26', club: 'BC De Mintons', hall: 'Sporthal De Witte Molen' },
  { id: 'gentse-bc', date: '2026-10-11', club: 'Gentse BC', hall: 'Sporthal Bourgoyen' },
  { id: 'lokerse-bc', date: '2026-10-25', club: 'Lokerse BC', hall: 'Sporthal Durmehal' },
  { id: 'dendermondse-bc', date: '2026-11-07', club: 'Dendermondse BC', hall: 'Sporthal Sint-Gillis' },
  { id: 'flee-shuttle', date: '2026-11-29', club: 'BK Flee shuttle', hall: 'Sporthal Flabbaert Knesselare' },
  { id: 'buggenhout', date: '2026-12-19', club: 'Badminton Buggenhout', hall: 'Sportcentrum De Pit', prijsuitreiking: true },
  { id: 'denderleeuw', date: '2027-01-23', club: 'BC Denderleeuw', hall: 'Sporthal Ottoy' },
  { id: 'pk-jeugd', date: '2027-02-13', club: 'PK Jeugd' },
  { id: 'wit-wit-ronse', date: '2027-02-27', club: 'Wit-Wit Ronse', hall: "Sporthal 't Rosco" },
  { id: 'landegem', date: '2027-03-14', club: 'BC Landegem', hall: 'Sporthal Oostbroek Nevele' },
  { id: 'latem-de-pinte', date: '2027-03-21', club: 'BC Latem-De Pinte', hall: 'Sporthal Sint-Martens-Latem' },
  { id: 'temse', date: '2027-04-25', club: 'BC Temse', hall: 'Sporthal Temsica' },
  { id: 'pluimplukkers', date: '2027-05-16', club: 'BC De Pluimplukkers', hall: 'S&R Rozebroeken' },
];

export const komende = (vanaf = vandaag()) => toernooien.filter((t) => t.date >= vanaf);

export const categorieen = [
  { id: 'minibad', label: 'Minibad', jaren: '2017 of later' },
  { id: 'u11', label: 'U11', jaren: '2016' },
  { id: 'u13', label: 'U13', jaren: '2014 en 2015' },
  { id: 'u15', label: 'U15', jaren: '2012 en 2013' },
  { id: 'u17-u19', label: 'U17+U19', jaren: '2008 tot en met 2011' },
];

/**
 * Reglement en bijlagen. Voorlopig placeholders: zet de pdf in public/ en vul `href` in
 * (bv. '/documenten/jeugdcuptour/reglement.pdf'). Zonder href toont de site "Volgt binnenkort".
 */
export const documenten: { title: string; text: string; href?: string }[] = [
  { title: 'Reglement', text: 'Regels van de jeugdcuptour (pdf)' },
  { title: 'Bijlagen', text: 'Wedstrijdindeling, puntenverdeling en reekshoofden (pdf)' },
];

/** Laatst gepubliceerde stand. Wordt in fase 2 afgeleid uit de rankingdata. */
export const laatsteRanking = { na: 'BC De Mintons', jaar: 2026 };
