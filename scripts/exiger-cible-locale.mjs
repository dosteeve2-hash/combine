const HOTES_LOCAUX = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  'postgres',
  'db',
  'host.docker.internal',
]);

export function estCibleLocale(valeur) {
  try {
    const hote = new URL(valeur).hostname.toLowerCase();
    return HOTES_LOCAUX.has(hote) || hote.endsWith('.localhost');
  } catch {
    return false;
  }
}

export function exigerCibleLocale(valeur, nomVariable) {
  if (!estCibleLocale(valeur)) {
    console.error(`${nomVariable} doit pointer vers une cible locale de test ; les hôtes distants sont refusés.`);
    process.exit(1);
  }
}
