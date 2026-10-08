/**
 * Zet een stand die uit Excel geplakt is om naar rijen.
 *
 * Verwachte kolommen (gescheiden door tabs, zoals Excel kopieert): positie, naam, club, punten.
 * - Dubbel/gemengd per paar: "Jan Peeters / Tom Claes" in de naamkolom, of vier middenkolommen (naam, club, naam, club).
 * - Een lege positie (gedeelde plaats) neemt de positie van de vorige rij over.
 * - Regels zonder punten op het einde (koppen, lege regels) worden overgeslagen.
 *
 * Wordt ook in /admin gebruikt voor het voorbeeld naast het invulveld (src/scripts/admin-preview.ts).
 */
export interface Speler {
  naam: string;
  club?: string;
}

export interface Rij {
  pos: number;
  spelers: Speler[];
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

const paar = (naam: string, club?: string): Speler[] => {
  const namen = naam.split(/\s+\/\s+|\s+&\s+/);
  if (namen.length < 2) return [{ naam, club }];
  const clubs = club?.split(/\s+\/\s+/) ?? [];
  return namen.map((n, i) => ({ naam: n, club: clubs.length === namen.length ? clubs[i] : club }));
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
    const midden = cellen.slice(pos !== undefined || gedeeld ? 1 : 0, -1).filter(Boolean);
    if (!midden.length) continue;
    // Geen positiekolom: tel zelf. Lege positie: gedeelde plaats met de rij erboven.
    pos ??= gedeeld ? (rijen.at(-1)?.pos ?? 1) : rijen.length + 1;

    const spelers =
      midden.length >= 4 ? [{ naam: midden[0], club: midden[1] }, { naam: midden[2], club: midden[3] }] : paar(midden[0], midden[1]);
    rijen.push({ pos, spelers, punten });
  }
  return rijen;
}

/** Punten zoals in België: komma als decimaalteken. */
export const toonPunten = (p: number) => p.toLocaleString('nl-BE', { maximumFractionDigits: 2 });
