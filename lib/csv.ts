/**
 * L'échappement CSV, en deux temps — et le premier compte plus que le second.
 *
 * 1. **Neutraliser la formule.** Excel, LibreOffice et Google Sheets évaluent toute
 *    cellule commençant par `=`, `+`, `-`, `@`, une tabulation ou un retour chariot.
 *    Les guillemets n'y changent rien : ils sont retirés à la lecture. Or ces cellules
 *    viennent du nom et de la ville saisis par le porteur, qui s'inscrit librement —
 *    sans ce préfixe, un candidat pourrait faire exécuter une commande sur le poste de
 *    l'incubateur qui ouvre le fichier.
 * 2. **Échapper le transport.** Guillemets doublés, et champ entre guillemets s'il
 *    contient un séparateur ou un saut de ligne.
 */
const DEBUTS_DANGEREUX = /^[=+\-@\t\r]/;

export function cellule(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '';
  let s = String(valeur);
  if (DEBUTS_DANGEREUX.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Une ligne CSV, séparateur point-virgule (attendu par Excel en français). */
export const ligneCsv = (valeurs: unknown[]): string => valeurs.map(cellule).join(';');

/**
 * Le fichier complet. Le BOM UTF-8 n'est pas décoratif : sans lui, Excel en français
 * casse tous les accents à l'ouverture.
 */
export function fichierCsv(entetes: string[], lignes: unknown[][]): string {
  return `﻿${[ligneCsv(entetes), ...lignes.map(ligneCsv)].join('\r\n')}`;
}
