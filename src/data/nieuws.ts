// Voorlopige selectie voor de home in fase 1. In fase 4 komt dit uit src/content/nieuws/.
export interface Bericht {
  slug: string;
  title: string;
  date: string;
  category: 'jeugd' | 'selectie' | 'evenement';
  excerpt: string;
}

export const recentNieuws: Bericht[] = [
  {
    slug: 'pk-pbo-in-nevele-deinze-nieuw-formaat',
    title: 'PK PBO in Nevele/Deinze – nieuw formaat',
    date: '2026-10-07',
    category: 'evenement',
    excerpt: 'Op 31 oktober en 1 november in Nevele, samen met BC Landegem. Met een nieuwe reeksindeling in alle disciplines.',
  },
  {
    slug: 'victor-jeugdcuptour-by-pbo-ranking-na-bc-de-mintons',
    title: 'Jeugdcuptour: ranking na BC De Mintons',
    date: '2026-09-29',
    category: 'jeugd',
    excerpt: 'De nieuwe stand staat online. Volgende halte: Gentse BC op 11 oktober.',
  },
  {
    slug: 'victor-jeugdcuptour-by-pbo-bc-de-mintons',
    title: 'Inschrijven voor de jeugdcup bij BC De Mintons',
    date: '2026-09-14',
    category: 'jeugd',
    excerpt: 'De eerste jeugdcup van het seizoen is op zaterdag 26 september in Sporthal De Witte Molen.',
  },
];

/** Korte versie van het belangrijkste bericht, voor de link bovenaan de home. */
export const uitgelicht = {
  slug: 'pk-pbo-in-nevele-deinze-nieuw-formaat',
  kort: 'PK op 31 oktober en 1 november in Nevele',
  kortMobiel: 'PK op 31 okt en 1 nov in Nevele',
};
