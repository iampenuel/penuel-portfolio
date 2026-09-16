import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  vite: { define: { 'import.meta.env.PHONE_MEDIA_QA': JSON.stringify(process.env.VERCEL_ENV === 'preview') } },
  output: 'static',
  site: 'https://iampenuel.vercel.app'
});
