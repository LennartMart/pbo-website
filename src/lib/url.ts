const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * Interne link met het basispad ervoor. Op GitHub Pages draait de site onder /pbo-website/,
 * op badminton-pbo.be onder /. Externe links, mailto en anchors blijven ongewijzigd.
 */
export function u(path: string): string;
export function u(path: string | undefined): string | undefined;
export function u(path?: string) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  return `${base}${path}`;
}
