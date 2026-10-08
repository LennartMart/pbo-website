import type { APIRoute } from 'astro';
import { beheerCollecties, cmsConfig } from '../../lib/cms';

export const GET: APIRoute = async ({ site }) => {
  const config = cmsConfig({ site: new URL(import.meta.env.BASE_URL, site), collections: await beheerCollecties() });
  return new Response(JSON.stringify(config, null, 2), { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
};
