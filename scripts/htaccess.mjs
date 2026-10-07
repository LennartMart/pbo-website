#!/usr/bin/env node
/**
 * Schrijft dist/.htaccess na de build (Apache op de shared hosting).
 *
 * - Oude WordPress-adressen → nieuwe routes (301). Berichten houden hun slug, dus één regel
 *   /JJJJ/MM/DD/<slug>/ → /nieuws/<slug> volstaat; enkel berichten waarvan de slug veranderde
 *   (legacyUrl wijst naar een andere slug) krijgen een eigen regel.
 * - http → https en badminton-pbo.be → www.badminton-pbo.be.
 * - Eigen 404-pagina en caching voor bestanden met een hash.
 *
 * Bestanden onder /wp-content/uploads/ staan als echte bestanden in dist (zelfde pad) en hebben
 * geen redirect nodig.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NIEUWS = join(ROOT, 'src/content/nieuws');
const DOEL = join(ROOT, 'dist/.htaccess');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Vaste redirects van oude WordPress-pagina's. Pad zonder begin- en eindslash. */
const PAGINAS = [
  ['jeugd/jeugdcup/pbo-jeugdcuptour-ranking', '/jeugd/jeugdcuptour/ranking'],
  ['jeugd/jeugdcup/pbo-jeugdcuptour-kalender', '/jeugd/jeugdcuptour/kalender'],
  ['jeugd/jeugdcup', '/jeugd/jeugdcuptour'],
];

async function afwijkendeSlugs() {
  const regels = [];
  for (const bestand of (await readdir(NIEUWS)).filter((f) => f.endsWith('.md'))) {
    const tekst = await readFile(join(NIEUWS, bestand), 'utf8');
    const fm = tekst.match(/^---\n([\s\S]*?)\n---/)?.[1];
    const legacy = fm && YAML.parse(fm)?.legacyUrl;
    if (!legacy) continue;
    const slug = bestand.replace(/\.md$/, '');
    const oud = legacy.replace(/^\/+|\/+$/g, '');
    const oudeSlug = oud.split('/').pop();
    if (oudeSlug !== slug) regels.push(`RewriteRule ^${esc(oud)}/?$ /nieuws/${slug} [R=301,L]`);
  }
  return regels.sort();
}

const extra = await afwijkendeSlugs();

const inhoud = `# Gegenereerd door scripts/htaccess.mjs bij elke build. Niet met de hand aanpassen.

ErrorDocument 404 /404.html
DirectoryIndex index.html index.php

<IfModule mod_rewrite.c>
  RewriteEngine On

  # https en www (enkel voor het hoofddomein; een testsubdomein blijft zoals het is)
  RewriteCond %{HTTPS} off
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteCond %{HTTP_HOST} ^(www\\.)?badminton-pbo\\.be$ [NC]
  RewriteRule ^ https://www.badminton-pbo.be%{REQUEST_URI} [R=301,L]
  RewriteCond %{HTTP_HOST} ^badminton-pbo\\.be$ [NC]
  RewriteRule ^ https://www.badminton-pbo.be%{REQUEST_URI} [R=301,L]

  # Oude WordPress-pagina's
${PAGINAS.map(([oud, nieuw]) => `  RewriteRule ^${esc(oud)}/?$ ${nieuw} [R=301,L]`).join('\n')}

  # Berichten met een gewijzigde slug
${extra.length ? extra.map((r) => `  ${r}`).join('\n') : '  # (geen)'}

  # Berichten: /2026/10/07/<slug>/ → /nieuws/<slug>
  RewriteRule ^\\d{4}/\\d{2}/\\d{2}/([^/]+)/?$ /nieuws/$1 [R=301,L]
  # Archief per jaar en maand
  RewriteRule ^(\\d{4})(/\\d{2})?/?$ /nieuws/archief/$1 [R=301,L]
  # Categorieën, tags, feeds en zoekpagina's van WordPress
  RewriteRule ^(category|tag|author|feed)(/.*)?$ /nieuws [R=301,L]
  RewriteCond %{QUERY_STRING} (^|&)s= [OR]
  RewriteCond %{QUERY_STRING} (^|&)p=\\d+
  RewriteRule ^$ /nieuws? [R=301,L]
</IfModule>

<IfModule mod_headers.c>
  # Bestanden met een hash in de naam (Astro: naam.AbC123xY.css) veranderen nooit.
  <FilesMatch "\\.[A-Za-z0-9_-]{8}\\.(js|css|woff2?|png|jpe?g|webp|avif|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.html$">
    Header set Cache-Control "public, max-age=300"
  </FilesMatch>
</IfModule>

AddType text/yaml .yml
AddType application/manifest+json .webmanifest
`;

await writeFile(DOEL, inhoud);
console.log(`.htaccess: ${PAGINAS.length} paginaredirects, ${extra.length} berichten met gewijzigde slug`);
