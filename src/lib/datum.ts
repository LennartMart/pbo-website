const TZ = 'Europe/Brussels';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('nl-BE', { timeZone: TZ, ...opts });

/** ISO-datum (YYYY-MM-DD) als middag in Brussel, zodat de dag nooit verschuift. */
export const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const dag = (iso: string) => fmt({ day: 'numeric' }).format(parse(iso));
export const dag2 = (iso: string) => fmt({ day: '2-digit' }).format(parse(iso));
export const maand = (iso: string) => fmt({ month: 'long' }).format(parse(iso));
export const maandKort = (iso: string) => maand(iso).slice(0, 3);
export const weekdag = (iso: string) => cap(fmt({ weekday: 'long' }).format(parse(iso)));
export const lang = (iso: string) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(parse(iso));

/** Vandaag in Brussel als YYYY-MM-DD (bij een statische site: het moment van de build). */
export const vandaag = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
