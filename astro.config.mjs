// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL en BASE_PATH komen van de GitHub Pages-workflow (https://lennartmart.github.io en /pbo-website).
// Zonder die variabelen bouwt de site voor www.badminton-pbo.be.
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.badminton-pbo.be',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
