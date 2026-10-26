# Licences des polices

Les polices de l’interface sont chargées dans `app/layout.tsx`.

| Famille | Chargement | Graisses | Licence |
|---|---|---|---|
| Familjen Grotesk | `next/font/google` | 400, 500, 600, 700 | SIL Open Font License 1.1 |
| Outfit | Fichier local `outfit.woff2` | 100 → 900 | SIL OFL 1.1 |
| JetBrains Mono | Fichier local `jetbrains-mono.woff2` | 100 → 800 | SIL OFL 1.1 |

Familjen Grotesk sert aux titres et accompagne le mot-symbole validé ; Outfit est la police de
lecture et JetBrains Mono sert aux informations techniques. Les fichiers Playfair Display présents
dans ce dossier ne sont plus chargés par l’application.

Next.js auto-héberge Familjen Grotesk dans les ressources générées : le navigateur n’appelle pas
Google Fonts. En revanche, `next/font/google` récupère les fichiers pendant la compilation ; un
environnement de build sans accès réseau ne pourra pas compiler cette police.

La SIL OFL 1.1 autorise l’auto-hébergement, la redistribution et l’usage commercial. Elle interdit
la vente des fichiers de police seuls et exige qu’une version modifiée change de nom. Les fichiers
locaux de ce dépôt sont intacts.
