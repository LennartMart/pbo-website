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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--site');
const SITE = (i > -1 ? process.argv[i + 1] : 'https://www.badminton-pbo.be').replace(/\/+$/, '');

const controles = [
  ['/jeugd/jeugdcup/pbo-jeugdcuptour-ranking/', '/jeugd/jeugdcuptour/ranking'],
  ['/jeugd/jeugdcup/pbo-jeugdcuptour-kalender/', '/jeugd/jeugdcuptour/kalender'],
];
const uploads = new Set();

async function lees(map) {
  for (const f of await readdir(join(ROOT, map), { recursive: true })) {
    if (!f.endsWith('.md')) continue;
    const tekst = await readFile(join(ROOT, map, f), 'utf8');
    for (const m of tekst.matchAll(/\/wp-content\/uploads\/[^\s)"'<>]+/g)) uploads.add(m[0]);
    if (map.endsWith('nieuws')) {
      const legacy = YAML.parse(tekst.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')?.legacyUrl;
      if (legacy) controles.push([legacy, `/nieuws/${f.replace(/\.md$/, '')}`]);
    }
  }
}
await lees('src/content/nieuws');
await lees('src/content/paginas');

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
