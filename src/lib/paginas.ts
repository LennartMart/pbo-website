import { getEntry, render } from 'astro:content';

/** Vaste pagina uit src/content/paginas/<id>.md, met de lopende tekst als <Content />. */
export async function pagina(id: string) {
  const entry = await getEntry('paginas', id);
  if (!entry) throw new Error(`Pagina src/content/paginas/${id}.md ontbreekt.`);
  const { Content } = await render(entry);
  return { ...entry.data, Content };
}
