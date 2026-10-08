---
target: landingspagina AI-vibes
total_score: 23
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 2
timestamp: 2026-10-08T08-31-21Z
slug: src-pages-index-astro
---
# Critique: homepage (src/pages/index.astro), vóór de herwerking

## Design Health Score

| # | Heuristiek | Score | Belangrijkste probleem |
|---|---|---|---|
| 1 | Zichtbaarheid status | 3 | Stand en volgende datum zichtbaar; geen "halte x van y" |
| 2 | Echte wereld | 3 | Vlaams en concreet, maar de H1 is een slogan; Ranking 2026 naast Kalender 2026-2027 onverklaard |
| 3 | Controle | 3 | Gewone links, skiplink, Esc sluit menu |
| 4 | Consistentie | 3 | Kalender met drie labels; heldkaart linkt naar kalendertop, rijen naar #halte |
| 5 | Fouten voorkomen | 2 | Geen geboortejaren op home; "Jeugdcup bij PK Jeugd"; seizoenslabel fout in augustus |
| 6 | Herkennen | 3 | Data zichtbaar, categorie moet gekend zijn |
| 7 | Flexibiliteit | n/a | Landingspagina |
| 8 | Esthetiek | 2 | Kalender 3x, ranking 2x, nieuwste bericht 2x, tegels herhalen het menu |
| 9 | Herstel | 2 | Lege toestanden zonder vervolglink |
| 10 | Hulp | 2 | Jeugdcuptour, categorie en inschrijven niet uitgelegd |
| **Totaal** | | **23/36** | **Acceptabel** |

## Design Specificity Verdict

Ja, AI-vibes. Inhoud is PBO, vorm is sjabloon: donkere afgeronde hero met aankondigingspil, slogan-H1 met één woord in accentkleur en twee pill-CTA's; vier gelijke icoontegels die het menu herhalen; overal dezelfde zachte witte kaart met lift-hover; twee identieke sectiekoppen met "→"; limoen promokader; drie gelijke nieuwskaarten. Echt PBO: de 88px-datum van de volgende halte en de datumlijst. Detector: 0 bevindingen (bron). Browseroverlay niet gelopen: chrome-devtools-profiel bezet.

## Priority Issues

1. [P1] Hero is het sjabloon; maak de volgende halte de hero (layout).
2. [P1] Toon de tour als lijn met haltes in plaats van een lijst witte kaarten (bolder).
3. [P2] Rankingkader is een promo: zoekveld en categorieën met geboortejaren (clarify).
4. [P2] Vier icoontegels weg; directe links voor clubs (distill).
5. [P2] Randgevallen: seizoenswissel, PK Jeugd, lege heldkolom, lange nieuwstitels (harden).

## Persona Red Flags

- Ouder (eerste keer): jeugdcuptour en categorie niet uitgelegd, geen inschrijven.
- Casey (telefoon): volgende halte onder 533px slogan; geen route; categorie vraagt 2 tikken extra.
- Clubsecretaris: competitieagenda en mail enkel in de footer.

## Minor Observations

- Naam PBO/Badminton Oost-Vlaanderen 4x op de pagina.
- Gewicht 800 op elke kop.
- Mobiel verbergt het 3e nieuwsbericht maar houdt 4 tegels.

## Questions to Consider

- Wat verliest een ouder als H1 en tegels verdwijnen?
- De code noemt toernooien al haltes: waarom geen lijn?
