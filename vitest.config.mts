import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // lib/db refuse de se charger sans chaîne de connexion ; les tests n'ouvrent
    // aucune connexion, ils n'exercent que les fonctions pures du module.
    env: { DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test' },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
});
