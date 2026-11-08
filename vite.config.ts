import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pages have real paths (/technique/raycasting), so assets need an absolute base.
// Set VAULT_BASE (e.g. /vault/) to host the vault in a subfolder instead of at the root of its own address.
export default defineConfig({
  base: process.env.VAULT_BASE ?? '/',
  plugins: [react()],
  // The graph page's chunk carries three.js; it is loaded only on that page.
  build: { chunkSizeWarningLimit: 1600 },
});
