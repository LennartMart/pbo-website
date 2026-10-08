#!/usr/bin/env node
/**
 * Controleert na een deploy of oude WordPress-adressen goed doorverwijzen en uploads bereikbaar zijn.
 *
 *   node scripts/controleer-redirects.mjs --site https://nieuw.badminton-pbo.be
 *
 * Leest legacyUrl uit src/content/nieuws en alle /wp-content/uploads/-links uit de content.
 * Toont enkel wat misloopt, plus een samenvatting.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OUDE_PAGINAS, ROOT, legacyUrls } from './oude-site.mjs';

const i = process.argv.indexOf('--site');
const SITE = (i > -1 ? process.argv[i + 1] : 'https://www.badminton-pbo.be').replace(/\/+$/, '');

const controles = [
  ...Object.entries(OUDE_PAGINAS).map(([oud, nieuw]) => [`${oud}/`, nieuw]),
  ...(await legacyUrls()).map(([slug, legacy]) => [legacy, `/nieuws/${slug}`]),
];

const uploads = new Set();
for (const map of ['src/content/nieuws', 'src/content/paginas']) {
  for (const f of await readdir(join(ROOT, map), { recursive: true })) {
    if (!f.endsWith('.md')) continue;
    const tekst = await readFile(join(ROOT, map, f), 'utf8');
    for (const m of tekst.matchAll(/\/wp-content\/uploads\/[^\s)"'<>]+/g)) uploads.add(m[0]);
  }
}

let fout = 0;
const pool = async (lijst, fn) => {
  const rij = [...lijst];
  await Promise.all(Array.from({ length: 6 }, async () => { for (let x = rij.shift(); x; x = rij.shift()) await fn(x); }));
};

await pool(controles, async ([oud, nieuw]) => {
  const res = await fetch(SITE + encodeURI(oud), { redirect: 'manual' });
  const naar = res.headers.get('location') ?? '';
  const pad = naar ? new URL(naar, SITE).pathname.replace(/\/$/, '') : '';
  if (res.status !== 301 || decodeURI(pad) !== nieuw) {
    fout++;
    console.log(`REDIRECT ${oud} → ${res.status} ${naar || '(geen)'} (verwacht 301 → ${nieuw})`);
  }
});
await pool(uploads, async (pad) => {
  const res = await fetch(SITE + pad, { method: 'HEAD' });
  if (res.status !== 200) {
    fout++;
    console.log(`UPLOAD ${decodeURI(pad)} → ${res.status}`);
  }
});

console.log(`\n${controles.length} redirects en ${uploads.size} uploads gecontroleerd op ${SITE}: ${fout ? `${fout} problemen` : 'alles in orde'}.`);
process.exit(fout ? 1 : 0);
