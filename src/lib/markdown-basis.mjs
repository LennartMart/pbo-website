/**
 * Sätteri-plugin (Markdown in Astro 7): zet het basispad voor interne links en afbeeldingen,
 * bv. /bestuur → /pbo-website/bestuur op GitHub Pages. Zelfde regel als u() in src/lib/url.ts.
 */
export function basisPlugin(base = '/') {
  const prefix = base.replace(/\/+$/, '');
  const intern = (v) => typeof v === 'string' && v.startsWith('/') && !v.startsWith('//');
  return {
    name: 'pbo-basispad',
    element: {
      filter: ['a', 'img', 'source'],
      visit(node, ctx) {
        if (!prefix) return;
        for (const key of ['href', 'src']) {
          const v = node.properties?.[key];
          if (intern(v)) ctx.setProperty(node, key, prefix + v);
        }
      },
    },
  };
}
