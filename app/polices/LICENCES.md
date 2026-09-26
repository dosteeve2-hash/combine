# Licences des polices

Les quatre fichiers de ce dossier sont des **polices variables**, sous-ensemble latin,
téléchargées depuis Google Fonts le 26/09/2026 et auto-hébergées.

| Fichier | Famille | Axe de graisse | Licence |
|---|---|---|---|
| `playfair-display.woff2` | Playfair Display (romain) | 400 → 900 | [SIL Open Font License 1.1](https://openfontlicense.org) |
| `playfair-display-italic.woff2` | Playfair Display (italique) | 400 → 900 | SIL OFL 1.1 |
| `outfit.woff2` | Outfit | 100 → 900 | SIL OFL 1.1 |
| `jetbrains-mono.woff2` | JetBrains Mono | 100 → 800 | SIL OFL 1.1 |

La SIL OFL 1.1 autorise explicitement l'auto-hébergement, la redistribution et
l'usage commercial. Elle interdit la vente des fichiers de police seuls et exige
que toute version modifiée change de nom — ni l'un ni l'autre n'est fait ici :
les fichiers sont intacts, seul le nom du fichier a changé, pas celui de la police.

## Pourquoi auto-hébergées

1. **Le build ne dépend plus du réseau.** `next/font/google` télécharge les
   polices pendant `next build`. Le 23/09/2026, c'est ce qui a fait tomber la CI
   de la PR #1 : `NextFontGoogleFontFileReplacer` a échoué sur JetBrains Mono,
   et le build s'est arrêté sur un `module-not-found` qui n'avait rien à voir
   avec le code.
2. **Le navigateur du visiteur ne parle plus à Google.** Une requête de moins
   vers un tiers, et aucune donnée de visite qui sort — ça compte pour un produit
   qui vend la vérifiabilité et la confidentialité d'un dossier.
3. **Une connexion de moins à ouvrir.** Sur une 3G à Ouagadougou, supprimer la
   résolution DNS, la poignée TLS et le trajet vers `fonts.gstatic.com` se voit.

Quatre fichiers, **139 Ko au total** — moins que les douze fichiers par graisse
qu'on obtiendrait sans polices variables.
