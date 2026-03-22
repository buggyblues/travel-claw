import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 4173,
    host: '0.0.0.0',
  },
  build: {
    outDir: path.resolve(__dirname, '../web'),
    emptyOutDir: true,
  },
});
