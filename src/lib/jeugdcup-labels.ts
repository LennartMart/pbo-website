/** Categorieën en reeksen (jongens, meisjes) van de jeugdcuptour. Los van astro:content, zodat ook /admin ze kan gebruiken. */
export const categorieen = [
  { id: 'minibad', label: 'Minibad' },
  { id: 'u11', label: 'U11' },
  { id: 'u13', label: 'U13' },
  { id: 'u15', label: 'U15' },
  { id: 'u17-u19', label: 'U17+U19' },
] as const;

/** De ranking telt per categorie apart voor jongens en meisjes. */
export const geslachten = [
  { id: 'jongens', label: 'Jongens' },
  { id: 'meisjes', label: 'Meisjes' },
] as const;

export type CategorieId = (typeof categorieen)[number]['id'];
export type GeslachtId = (typeof geslachten)[number]['id'];

export const categorieLabel = (id: string) => categorieen.find((c) => c.id === id)?.label ?? id;
export const geslachtLabel = (id: string) => geslachten.find((g) => g.id === id)?.label ?? id;
