import { describe, expect, it } from 'vitest';
import { estCibleLocale } from '../scripts/exiger-cible-locale.mjs';

describe('les scripts de test n’acceptent que les cibles locales', () => {
  it('accepte loopback, localhost et le service Postgres de CI', () => {
    expect(estCibleLocale('postgresql://combine:test@127.0.0.1:5432/combine')).toBe(true);
    expect(estCibleLocale('http://localhost:3000')).toBe(true);
    expect(estCibleLocale('postgresql://combine:test@postgres:5432/combine')).toBe(true);
  });

  it('refuse les hôtes distants et les URL invalides', () => {
    expect(estCibleLocale('postgresql://combine:test@ep-example.neon.tech/combine')).toBe(false);
    expect(estCibleLocale('https://combine.example.com')).toBe(false);
    expect(estCibleLocale('pas-une-url')).toBe(false);
  });
});
