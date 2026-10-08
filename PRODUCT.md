# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Jeugdspelers en hun ouders die een datum, sporthal of hun plaats in de jeugdcuptour-ranking zoeken, meestal op de telefoon.
- Oost-Vlaamse clubs en competitiespelers die de competitieagenda, standen, reglementen en contactadressen nodig hebben.
- Recreanten en G-sporters, en wie zich als vrijwilliger bij PBO wil aansluiten.
- Een gewone user voegt enkel uitslagen/rankings van de jeugdcuptour toe; een beheerder beheert de rest.

## Product Purpose

Website van PBO vzw (Provinciale Badmintonraad Oost-Vlaanderen). Ze vervangt de WordPress-site badminton-pbo.be door een statische site. Succes: een ouder vindt in een paar tikken de volgende jeugdcup of de stand van het eigen kind, en een club vindt meteen de juiste link of het juiste mailadres.

## Positioning

De enige plek met de officiële kalender en ranking van de Victor Jeugdcuptour by PBO, plus de provinciale informatie (competitie, PK, selectie) van Oost-Vlaanderen.

## Operating Context

- Jeugdcups lopen per seizoen, de ranking per kalenderjaar. Na elk toernooi komt een nieuwe stand online.
- Competitiezaken lopen via Badminton Vlaanderen (Badman-app, uitslagen en standen). Van de PBO-competitie-app blijft enkel de agenda (`competitie.badminton-pbo.be/agenda/`) in gebruik.
- Google Calendar van `secretariaat@badminton-pbo.be` bevat de PBO-kalender.

## Capabilities and Constraints

Zie `CLAUDE.md` voor stack, contentmodel, routes, migratie en fasering. Open beslissingen staan daar ook.

## Brand Commitments

- Naam: PBO vzw, voluit Provinciale Badmintonraad Oost-Vlaanderen vzw.
- Logo: bestaand PBO-logo (zwarte letters "pbo" met groene zwieren). Bronnen: `wp-content/uploads/2011/05/LOGOKLEU.jpg` (kleur) en `2020/09/PBOBlacktransparant.png` (zwart).
- Kleuren van de huidige site: logogroen `#005E44`, limoengroen `#A1F16B` (headerverloop). Gebruiker koos diepgroen voor donkere vlakken.
- Sponsor Mobi-sports blijft zichtbaar, in de footer.
- Taal: Vlaams, je-vorm, kort en concreet.

## Evidence on Hand

- Pagina-inhoud en nieuws op `testsite.badminton-pbo.be` (WP REST API werkt).
- Kalender jeugdcuptour 2026-2027 en leeftijdscategorieën 2026 staan op de huidige kalenderpagina.
- Geen testimonials, cijfers of foto's van evenementen beschikbaar; niet verzinnen.

## Product Principles

1. Wie iets zoekt, vindt het eerst: datum, plaats, club, categorie.
2. Telefoon eerst; ouders staan vaak in een sporthal.
3. Feiten van PBO, geen slogans.
4. Een gewone user kan niets anders kapotmaken dan de jeugdcupranking.

## Accessibility & Inclusion

Contrast minstens 4.5:1, touch targets minstens 44px, toetsenbordbediening. G-sport is een doelgroep.
