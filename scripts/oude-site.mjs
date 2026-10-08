/**
 * Wat de scripts over de oude WordPress-site delen: de vaste paginaredirects en de legacyUrl van elk bericht.
 * Gebruikt door htaccess.mjs, controleer-redirects.mjs en migreer-wordpress.mjs.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Oude WordPress-pagina's → nieuwe routes (301). Paden zonder slash op het einde. */
export const OUDE_PAGINAS = {
  '/jeugd/jeugdcup/pbo-jeugdcuptour-ranking': '/jeugd/jeugdcuptour/ranking',
  '/jeugd/jeugdcup/pbo-jeugdcuptour-kalender': '/jeugd/jeugdcuptour/kalender',
  '/jeugd/jeugdcup': '/jeugd/jeugdcuptour',
};

/** Frontmatter en tekst van een Markdown-bestand, ook met Windows-regeleindes (git core.autocrlf). */
export function leesFrontmatter(bron) {
  const [, fm = '', body = bron] = bron.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) ?? [];
  return { data: YAML.parse(fm) ?? {}, body };
}

/** [slug, legacyUrl] van elk nieuwsbericht dat uit WordPress komt. */
export async function legacyUrls() {
  const map = join(ROOT, 'src/content/nieuws');
  const lijst = [];
  for (const bestand of (await readdir(map)).filter((f) => f.endsWith('.md'))) {
    const { legacyUrl } = leesFrontmatter(await readFile(join(map, bestand), 'utf8')).data;
    if (legacyUrl) lijst.push([bestand.replace(/\.md$/, ''), legacyUrl]);
  }
  return lijst;
}
