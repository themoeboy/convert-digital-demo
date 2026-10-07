import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import shopify from 'vite-plugin-shopify';
import tailwindcss from '@tailwindcss/vite';



export default defineConfig({
  plugins: [
    shopify({
      themeRoot: './',
      sourceCodeDir: 'frontend',
      entrypointsDir: 'frontend/entrypoints',
      snippetFile: 'vite-tag.liquid',
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    emptyOutDir: false,
    sourcemap: false,
  },
});
