/**
 * Reglement en bijlagen. Voorlopig placeholders: zet de pdf in public/ en vul `href` in
 * (bv. '/documenten/jeugdcuptour/reglement.pdf'). Zonder href toont de site "Volgt binnenkort".
 */
export const documenten: { title: string; text: string; href?: string }[] = [
  { title: 'Reglement', text: 'Regels van de jeugdcuptour (pdf)' },
  { title: 'Bijlagen', text: 'Wedstrijdindeling, puntenverdeling en reekshoofden (pdf)' },
];

/** Eindstanden van voor de nieuwe site, als pdf in public/wp-content/uploads/. Nieuwste eerst. */
export const archief: { label: string; href?: string }[] = [];
