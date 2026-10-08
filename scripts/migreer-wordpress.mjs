#!/usr/bin/env node
/**
 * Nieuwsmigratie uit WordPress (fase 4).
 *
 *   node scripts/migreer-wordpress.mjs [--bron https://testsite.badminton-pbo.be] [--zonder-uploads]
 *
 * - Haalt alle berichten op via de WP REST API en schrijft ze naar src/content/nieuws/<slug>.md
 *   (frontmatter: title, date, category, excerpt, legacyUrl).
 * - Herschrijft links: oude domeinen (ook pbo.kwal.org) worden relatieve paden, oude bericht-URL's
 *   worden /nieuws/<slug>, oude pagina's de nieuwe routes.
 * - Downloadt elke gelinkte upload (pdf, afbeelding, Excel ...) uit berichten én pagina's naar
 *   public/wp-content/uploads/... op hetzelfde pad, zodat externe links blijven werken.
 * - Leest de archief-pdf's van de oude rankingpagina in src/content/paginas/jeugdcuptour.md.
 * - Schrijft een rapport naar scripts/uitvoer/migratie-rapport.md (wat niet lukte, links naar kwal.org ...).
 *
 * Opnieuw draaien mag: bestanden worden overschreven, bestaande uploads overgeslagen.
 * De WordPress-site zelf wordt enkel gelezen.
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';
import { decodeHTML } from 'entities';
import YAML from 'yaml';
import { OUDE_PAGINAS, ROOT, leesFrontmatter } from './oude-site.mjs';

const args = process.argv.slice(2);
const optie = (naam, standaard) => {
  const i = args.indexOf(`--${naam}`);
  return i === -1 ? standaard : args[i + 1];
};
const BRON = optie('bron', 'https://testsite.badminton-pbo.be').replace(/\/+$/, '');
const ZONDER_UPLOADS = args.includes('--zonder-uploads');

/** Domeinen waarvan links intern worden. */
const OUDE_HOSTS = ['badminton-pbo.be', 'www.badminton-pbo.be', 'testsite.badminton-pbo.be', 'pbo.kwal.org', 'www.pbo.kwal.org', new URL(BRON).host];

/** Oude WordPress-pagina's → nieuwe routes: de redirects uit oude-site.mjs plus de pagina's die hun pad houden. */
export const PAGINA_MAP = {
  ...OUDE_PAGINAS,
  '/jeugd': '/jeugd',
  '/bestuur': '/bestuur',
  '/competitie': '/competitie',
  '/recreanten': '/recreanten',
  '/vacatures': '/vacatures',
};

const rapport = { kwal: [], onbekendeLinks: new Map(), uploadsMislukt: [], categorieen: new Map(), waarschuwingen: [] };

// ---------------------------------------------------------------- ophalen

async function haal(pad) {
  const url = pad.startsWith('http') ? pad : `${BRON}/wp-json/wp/v2/${pad}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'pbo-website-migratie' } });
  if (!res.ok) throw new Error(`${res.status} bij ${url}`);
  return { data: await res.json(), paginas: Number(res.headers.get('x-wp-totalpages') ?? 1) };
}

async function alles(type, velden) {
  const items = [];
  for (let pagina = 1; ; pagina++) {
    const { data, paginas } = await haal(`${type}?per_page=100&page=${pagina}&_fields=${velden}`);
    items.push(...data);
    process.stdout.write(`\r${type}: ${items.length}`);
    if (pagina >= paginas || data.length === 0) break;
  }
  process.stdout.write('\n');
  return items;
}

// ---------------------------------------------------------------- tekst

const tekst = (html = '') =>
  decodeHTML(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

/** Samenvatting: WordPress-excerpt zonder "[…]" of "Lees meer", maximaal ±220 tekens op een woordgrens. */
export function samenvatting(excerptHtml, contentHtml) {
  let t = tekst(excerptHtml || contentHtml)
    .replace(/\s*(\[(…|&hellip;|\.\.\.)\]|…|Lees meer.*|Read more.*|Continue reading.*)$/i, '')
    .trim();
  if (t.length > 220) t = `${t.slice(0, 220).replace(/\s+\S*$/, '')}…`;
  return t;
}

/** WordPress-categorieën → nieuwscategorie van de nieuwe site. Eerste treffer wint. */
const CATEGORIE_REGELS = [
  ['selectie', /selectie|provinciale? training/i],
  ['competitie', /competitie|interclub|ploeg/i],
  ['recreanten', /recrea|g-sport|gsport/i],
  ['jeugd', /jeugd|minibad|ipjo|kyu|u1[0-9]/i],
  ['evenement', /evenement|kampioenschap|\bpk\b|tornooi|toernooi|feest|dag van/i],
];

export function kiesCategorie(wpNamen, titel) {
  for (const bron of [wpNamen.join(' '), titel]) {
    for (const [cat, re] of CATEGORIE_REGELS) if (re.test(bron)) return cat;
  }
  return 'algemeen';
}

// ---------------------------------------------------------------- links

const uploads = new Set();

/** Absolute of relatieve URL uit WordPress → nieuw pad (of ongewijzigd als extern). */
export function nieuweLink(href, bron = '') {
  if (!href || /^(mailto:|tel:|#|javascript:)/i.test(href)) return href;
  let url;
  try {
    url = new URL(href, BRON);
  } catch {
    return href;
  }
  const host = url.host.toLowerCase();
  if (!OUDE_HOSTS.includes(host)) return href;
  if (host.includes('kwal.org')) rapport.kwal.push(`${bron}: ${href}`);

  const pad = decodeURI(url.pathname);
  if (pad.startsWith('/wp-content/uploads/')) {
    uploads.add(pad);
    return encodeURI(pad);
  }
  const bericht = pad.match(/^\/\d{4}\/\d{2}\/(?:\d{2}\/)?([^/]+)\/?$/);
  if (bericht) return `/nieuws/${bericht[1]}`;
  const zonderSlash = pad.replace(/\/+$/, '') || '/';
  if (zonderSlash === '/') return '/';
  if (PAGINA_MAP[zonderSlash]) return PAGINA_MAP[zonderSlash] + url.hash;
  if (/^\/(category|tag)\//.test(pad)) return '/nieuws';
  rapport.onbekendeLinks.set(pad, [...(rapport.onbekendeLinks.get(pad) ?? []), bron]);
  return pad + url.search + url.hash;
}

/** Gekende WordPress-shortcodes; andere tekst tussen [ ] blijft staan. */
const SHORTCODE =
  /\[\/?(?:gallery|embed|video|audio|playlist|wp_caption|contact-form-7|wpforms|pdf-embedder|google-calendar|gcal|(?:vc|et_pb|su|fusion)_[a-z_]+)(?:\s[^\]]*)?\]/gi;

/** HTML uit WordPress opkuisen vóór de omzetting naar Markdown. */
export function kuisHtml(html, bron) {
  return (
    html
      // Shortcodes: [caption]tekst[/caption] → tekst, andere ([gallery], [embed] ...) weg.
      .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, '$1')
      .replace(SHORTCODE, (m) => {
        rapport.waarschuwingen.push(`${bron}: shortcode verwijderd ${m.slice(0, 60)}`);
        return '';
      })
      // Responsive varianten zijn niet nodig.
      .replace(/\s(srcset|sizes)="[^"]*"/g, '')
      .replace(/\s(href|src)="([^"]*)"/g, (_, attr, v) => ` ${attr}="${nieuweLink(decodeHTML(v), bron)}"`)
  );
}

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
// Tabellen en embeds (YouTube, Google Agenda) blijven HTML; Markdown kan ze niet goed weergeven.
turndown.keep(['table', 'iframe', 'video', 'audio']);
turndown.remove(['script', 'style', 'noscript']);
// Koppen in een bericht beginnen op h2 (h1 is de titel).
turndown.addRule('koppen', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: (inhoud, node) => {
    const niveau = Math.min(Math.max(Number(node.nodeName[1]), 2), 4);
    return `\n\n${'#'.repeat(niveau)} ${inhoud.trim()}\n\n`;
  },
});

export const naarMarkdown = (html, bron) =>
  turndown
    .turndown(kuisHtml(html, bron))
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// ---------------------------------------------------------------- schrijven

const bestaat = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

const frontmatter = (data) => `---\n${YAML.stringify(data, { lineWidth: 0 }).trim()}\n---\n`;

async function downloadUploads() {
  const lijst = [...uploads].sort();
  let nieuw = 0;
  const wachtrij = [...lijst];
  async function werker() {
    for (let pad = wachtrij.shift(); pad; pad = wachtrij.shift()) {
      const doel = join(ROOT, 'public', pad);
      if (await bestaat(doel)) continue;
      try {
        const res = await fetch(BRON + encodeURI(pad));
        if (!res.ok) throw new Error(String(res.status));
        await mkdir(dirname(doel), { recursive: true });
        await writeFile(doel, Buffer.from(await res.arrayBuffer()));
        nieuw++;
        process.stdout.write(`\ruploads: ${nieuw} nieuw`);
      } catch (e) {
        rapport.uploadsMislukt.push(`${pad} (${e.message})`);
      }
    }
  }
  await Promise.all([werker(), werker(), werker(), werker()]);
  process.stdout.write('\n');
  return { totaal: lijst.length, nieuw };
}

/** Archief-pdf's van de oude rankingpagina naar src/content/paginas/jeugdcuptour.md. */
async function archiefRankings(paginas) {
  const ranking = paginas.find((p) => p.slug === 'pbo-jeugdcuptour-ranking');
  if (!ranking) {
    rapport.waarschuwingen.push('Pagina pbo-jeugdcuptour-ranking niet gevonden: archief niet ingevuld.');
    return 0;
  }
  const links = [...ranking.content.rendered.matchAll(/<a[^>]+href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi)].map(([, href, label]) => ({
    label: tekst(label) || decodeURI(href.split('/').pop()),
    bestand: nieuweLink(decodeHTML(href), 'pbo-jeugdcuptour-ranking'),
  }));
  const uniek = [...new Map(links.map((l) => [l.bestand, l])).values()];
  const pad = join(ROOT, 'src/content/paginas/jeugdcuptour.md');
  const { data, body } = leesFrontmatter(await readFile(pad, 'utf8'));
  data.archief = uniek;
  await writeFile(pad, frontmatter(data) + '\n' + body.replace(/^(\r?\n)+/, ''));
  return uniek.length;
}

async function main() {
  console.log(`Bron: ${BRON}`);
  const cats = new Map((await alles('categories', 'id,name,slug')).map((c) => [c.id, decodeHTML(c.name)]));
  const posts = await alles('posts', 'id,date,slug,link,title,content,excerpt,categories');
  const paginas = await alles('pages', 'id,slug,link,title,content');

  await mkdir(join(ROOT, 'src/content/nieuws'), { recursive: true });
  const slugs = new Set();
  for (const p of posts) {
    const slug = decodeURIComponent(p.slug);
    if (slugs.has(slug)) rapport.waarschuwingen.push(`Dubbele slug ${slug}: laatste wint.`);
    slugs.add(slug);
    const titel = tekst(p.title.rendered);
    const wpNamen = (p.categories ?? []).map((id) => cats.get(id) ?? '');
    const category = kiesCategorie(wpNamen, titel);
    const sleutel = `${wpNamen.join(', ') || '(geen)'} → ${category}`;
    rapport.categorieen.set(sleutel, (rapport.categorieen.get(sleutel) ?? 0) + 1);

    const data = {
      title: titel,
      date: p.date.slice(0, 10),
      category,
      excerpt: samenvatting(p.excerpt?.rendered, p.content.rendered) || titel,
      legacyUrl: decodeURI(new URL(p.link).pathname),
    };
    const body = naarMarkdown(p.content.rendered, slug);
    await writeFile(join(ROOT, 'src/content/nieuws', `${slug}.md`), `${frontmatter(data)}\n${body}\n`);
  }
  console.log(`berichten: ${posts.length} geschreven`);

  // Uploads uit pagina's ook meenemen (statuten, formulieren, archief ...).
  for (const p of paginas) kuisHtml(p.content.rendered, `pagina ${p.slug}`);
  const archief = await archiefRankings(paginas);
  console.log(`archief jeugdcuptour: ${archief} pdf's`);

  const up = ZONDER_UPLOADS ? { totaal: uploads.size, nieuw: 0 } : await downloadUploads();

  const regels = [
    `# Migratierapport WordPress`,
    ``,
    `Bron: ${BRON} · ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `- Berichten: ${posts.length}`,
    `- Gelinkte uploads: ${up.totaal} (${up.nieuw} nieuw gedownload${ZONDER_UPLOADS ? ', downloaden overgeslagen' : ''})`,
    `- Archief-pdf's jeugdcuptour: ${archief}`,
    ``,
    `## Categorieën (WordPress → nieuw)`,
    ``,
    ...[...rapport.categorieen.entries()].sort().map(([k, n]) => `- ${k}: ${n}`),
    ``,
    `## Links naar pbo.kwal.org (vervangen door relatieve paden)`,
    ``,
    ...(rapport.kwal.length ? rapport.kwal.map((l) => `- ${l}`) : ['Geen.']),
    ``,
    `## Interne links zonder nieuwe bestemming`,
    ``,
    'Deze oude paden bestaan niet meer op de nieuwe site. Voeg ze toe aan PAGINA_MAP of aan de redirects.',
    ``,
    ...(rapport.onbekendeLinks.size
      ? [...rapport.onbekendeLinks.entries()].map(([pad, bronnen]) => `- \`${pad}\` (${[...new Set(bronnen)].slice(0, 3).join(', ')})`)
      : ['Geen.']),
    ``,
    `## Uploads die niet te downloaden waren`,
    ``,
    ...(rapport.uploadsMislukt.length ? rapport.uploadsMislukt.map((l) => `- ${l}`) : ['Geen.']),
    ``,
    `## Waarschuwingen`,
    ``,
    ...(rapport.waarschuwingen.length ? rapport.waarschuwingen.map((l) => `- ${l}`) : ['Geen.']),
    ``,
  ];
  await mkdir(join(ROOT, 'scripts/uitvoer'), { recursive: true });
  await writeFile(join(ROOT, 'scripts/uitvoer/migratie-rapport.md'), regels.join('\n'));
  console.log('rapport: scripts/uitvoer/migratie-rapport.md');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
