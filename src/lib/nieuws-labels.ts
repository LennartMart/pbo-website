/** Nieuwscategorieën. Los van astro:content, zodat ook de Decap-config ze kan gebruiken. */
export const nieuwsCategorieen = [
  { id: 'jeugd', label: 'Jeugd' },
  { id: 'selectie', label: 'Selectie' },
  { id: 'evenement', label: 'Evenement' },
  { id: 'competitie', label: 'Competitie' },
  { id: 'recreanten', label: 'Recreanten' },
  { id: 'algemeen', label: 'Algemeen' },
] as const;

export const categorieNaam = (id: string) => nieuwsCategorieen.find((c) => c.id === id)?.label ?? id;
