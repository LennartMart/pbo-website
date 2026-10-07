/** Categorieën en disciplines van de jeugdcuptour. Los van astro:content, zodat ook /admin ze kan gebruiken. */
export const categorieen = [
  { id: 'minibad', label: 'Minibad' },
  { id: 'u11', label: 'U11' },
  { id: 'u13', label: 'U13' },
  { id: 'u15', label: 'U15' },
  { id: 'u17-u19', label: 'U17+U19' },
] as const;

export const disciplines = [
  { id: 'enkel', label: 'Enkel' },
  { id: 'dubbel', label: 'Dubbel' },
  { id: 'gemengd', label: 'Gemengd' },
] as const;

export type CategorieId = (typeof categorieen)[number]['id'];
export type DisciplineId = (typeof disciplines)[number]['id'];

export const categorieLabel = (id: string) => categorieen.find((c) => c.id === id)?.label ?? id;
export const disciplineLabel = (id: string) => disciplines.find((d) => d.id === id)?.label ?? id;

/** Geboortejaren per categorie in een kalenderjaar (in 2026: Minibad 2017 of later, U11 2016, ...). */
export function geboortejaren(id: CategorieId, jaar: number) {
  switch (id) {
    case 'minibad':
      return `${jaar - 9} of later`;
    case 'u11':
      return `${jaar - 10}`;
    case 'u13':
      return `${jaar - 12} en ${jaar - 11}`;
    case 'u15':
      return `${jaar - 14} en ${jaar - 13}`;
    case 'u17-u19':
      return `${jaar - 18} tot en met ${jaar - 15}`;
  }
}
