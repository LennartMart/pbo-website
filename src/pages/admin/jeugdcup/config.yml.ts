import type { APIRoute } from 'astro';
import { cmsConfig, rankingsCollectie } from '../../../lib/cms';

/** Gewone users zien enkel de rankings. */
export const GET: APIRoute = async ({ site }) => {
  const config = cmsConfig({ site: new URL(import.meta.env.BASE_URL, site), collections: [await rankingsCollectie()] });
  return new Response(JSON.stringify(config, null, 2), { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
};
