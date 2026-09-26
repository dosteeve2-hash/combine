import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Le 26 septembre, le déploiement Vercel de COMBINE est tombé sur
 * « Failed to collect page data » : `lib/db.ts` exigeait DATABASE_URL à l'import,
 * donc `next build` réclamait un secret de production pour seulement compiler.
 * Ces deux tests fixent le contrat inverse — importer ne demande rien, requêter
 * demande tout — pour que la panne ne puisse pas revenir sans être vue.
 */
describe('la couche base sans DATABASE_URL', () => {
  const initial = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    vi.resetModules();
    if (initial === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = initial;
  });

  it('s’importe sans erreur : un build n’a pas besoin du secret de production', async () => {
    const base = await import('@/lib/db');
    expect(typeof base.sql).toBe('function');
    expect(base.nouvelId('dos')).toMatch(/^dos_/);
    expect(base.postgresOrdinaire()).toBe(false);
  });

  it('refuse la première requête, en nommant la variable qui manque', async () => {
    const { sql } = await import('@/lib/db');
    await expect(sql`select 1`).rejects.toThrow(/DATABASE_URL est absent/);
  });
});

describe('le choix du pilote', () => {
  const initial = process.env.DATABASE_URL;

  afterEach(() => {
    vi.resetModules();
    if (initial === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = initial;
  });

  it('voit Neon sur un hôte .neon.tech, et un Postgres ordinaire ailleurs', async () => {
    vi.resetModules();
    process.env.DATABASE_URL = 'postgresql://u:p@ep-x-123.eu-central-1.aws.neon.tech/combine?sslmode=require';
    const surNeon = await import('@/lib/db');
    expect(surNeon.postgresOrdinaire()).toBe(false);

    vi.resetModules();
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/combine';
    const enLocal = await import('@/lib/db');
    expect(enLocal.postgresOrdinaire()).toBe(true);
  });
});
