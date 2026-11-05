import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pages have real paths (/technique/raycasting), so assets need an absolute base.
// Set VAULT_BASE to host the vault somewhere other than GitHub Pages' /3d-selection-vault/.
export default defineConfig({
  base: process.env.VAULT_BASE ?? '/3d-selection-vault/',
  plugins: [react()],
  // The graph page's chunk carries three.js; it is loaded only on that page.
  build: { chunkSizeWarningLimit: 1600 },
});
