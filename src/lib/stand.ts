/**
 * Zet een stand die uit Excel geplakt is om naar rijen.
 *
 * Verwachte kolommen (gescheiden door tabs, zoals Excel kopieert): positie, naam, club, punten.
 * Getallen tussen club en totaal (lidnummer, punten per halte) worden genegeerd: zo mag de hele Excel-rij mee.
 * - De eerste tekstkolom is de naam, de tweede de club.
 * - Een lege positie (gedeelde plaats) neemt de positie van de vorige rij over.
 * - Regels zonder punten op het einde (koppen, lege regels) worden overgeslagen.
 *
 * Wordt ook in /admin gebruikt voor het voorbeeld naast het invulveld (src/scripts/admin-preview.ts).
 */
export interface Rij {
  pos: number;
  naam: string;
  club?: string;
  punten: number;
}

const getal = (s: string) => {
  const t = s.replace(/\s/g, '').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
};

const splits = (regel: string) => {
  const cellen = regel.includes('\t') ? regel.split('\t') : regel.split(/\s{2,}|;/);
  return cellen.map((c) => c.trim());
};

export function leesStand(tekst: string): Rij[] {
  const rijen: Rij[] = [];
  for (const regel of tekst.split(/\r?\n/)) {
    const cellen = splits(regel);
    while (cellen.length && cellen.at(-1) === '') cellen.pop();
    if (cellen.length < 2) continue;

    const punten = getal(cellen.at(-1)!);
    if (punten === undefined) continue;

    const eerste = cellen[0].replace(/\.$/, '');
    const gedeeld = eerste === '' || eerste === '=';
    let pos = getal(eerste);
    const midden = cellen.slice(pos !== undefined || gedeeld ? 1 : 0, -1).filter((c) => c && getal(c) === undefined);
    if (!midden.length) continue;
    // Geen positiekolom: tel zelf. Lege positie: gedeelde plaats met de rij erboven.
    pos ??= gedeeld ? (rijen.at(-1)?.pos ?? 1) : rijen.length + 1;

    const [naam, club] = midden;
    rijen.push({ pos, naam, club, punten });
  }
  return rijen;
}

/** Punten zoals in België: komma als decimaalteken. */
export const toonPunten = (p: number) => p.toLocaleString('nl-BE', { maximumFractionDigits: 2 });
