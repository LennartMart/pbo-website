/**
 * Voorbeeld rechts in Decap bij een jeugdcup-stand: toont de geplakte stand zoals de site ze leest,
 * met dezelfde parser als de site (src/lib/stand.ts). Zo zie je meteen of het plakken gelukt is.
 */
import { leesStand, toonPunten } from '../lib/stand';
import { categorieLabel, geslachtLabel } from '../lib/jeugdcup-labels';

type H = (tag: unknown, props?: Record<string, unknown> | null, ...children: unknown[]) => unknown;
interface Entry {
  getIn(path: string[]): unknown;
}

const w = window as unknown as {
  CMS?: { registerPreviewTemplate(name: string, component: (props: { entry: Entry }) => unknown): void };
  h?: H;
};

const kleur = { ink: '#0C2A20', muted: '#4A5852', wash: '#ECEEE6', brand: '#005E44', zacht: '#DCF7C8' };

function StandVoorbeeld({ entry }: { entry: Entry }) {
  const h = w.h!;
  const tekst = String(entry.getIn(['data', 'stand']) ?? '');
  const rijen = leesStand(tekst);
  const regels = tekst.split(/\r?\n/).filter((r) => r.trim()).length;
  const overgeslagen = regels - rijen.length;
  const cat = categorieLabel(String(entry.getIn(['data', 'categorie']) ?? ''));
  const geslacht = geslachtLabel(String(entry.getIn(['data', 'geslacht']) ?? ''));
  const toernooi = String(entry.getIn(['data', 'toernooi']) ?? '');

  const cel = { padding: '10px 12px', borderTop: `1px solid ${kleur.wash}`, verticalAlign: 'top' };
  return h(
    'div',
    { style: { fontFamily: 'system-ui, sans-serif', color: kleur.ink, padding: 24 } },
    h('h2', { style: { margin: '0 0 4px', fontSize: 24 } }, `${cat || 'Categorie?'} · ${geslacht || 'jongens of meisjes?'}`),
    h('p', { style: { margin: '0 0 16px', color: kleur.muted } }, toernooi ? `Stand na ${toernooi}` : 'Kies eerst een toernooi.'),
    rijen.length === 0
      ? h('p', { style: { background: kleur.zacht, padding: 16, borderRadius: 12 } }, 'Nog geen stand. Plak de kolommen positie, naam, club en punten uit Excel.')
      : h(
          'div',
          null,
          h('p', { style: { margin: '0 0 12px', fontWeight: 600, color: kleur.brand } }, `${rijen.length} ${rijen.length === 1 ? 'rij' : 'rijen'} herkend.`),
          overgeslagen > 0 &&
            h(
              'p',
              { style: { margin: '0 0 12px', background: '#FFF4D6', padding: 12, borderRadius: 12 } },
              `${overgeslagen} ${overgeslagen === 1 ? 'regel' : 'regels'} overgeslagen: geen punten in de laatste kolom (bv. de kopregel). Klopt dat?`,
            ),
          h(
            'table',
            { style: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' } },
            h(
              'thead',
              null,
              h('tr', { style: { color: kleur.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em' } },
                h('th', { style: { padding: '8px 12px' } }, '#'),
                h('th', { style: { padding: '8px 12px' } }, 'Speler'),
                h('th', { style: { padding: '8px 12px' } }, 'Club'),
                h('th', { style: { padding: '8px 12px', textAlign: 'right' } }, 'Punten'),
              ),
            ),
            h(
              'tbody',
              null,
              ...rijen.map((r, i) =>
                h('tr', { key: i },
                  h('td', { style: { ...cel, fontWeight: 800 } }, r.pos),
                  h('td', { style: { ...cel, fontWeight: 600 } }, ...r.spelers.map((s, j) => h('div', { key: j }, s.naam))),
                  h('td', { style: { ...cel, color: kleur.muted } }, ...r.spelers.map((s, j) => h('div', { key: j }, s.club ?? ''))),
                  h('td', { style: { ...cel, textAlign: 'right', fontWeight: 600 } }, toonPunten(r.punten)),
                ),
              ),
            ),
          ),
        ),
  );
}

w.CMS?.registerPreviewTemplate('rankings', StandVoorbeeld);
