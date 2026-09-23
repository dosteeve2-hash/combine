# COMBINE — passation Codex / Claude

> Mis à jour le 23/09/2026. Lire avant toute reprise ; ne pas refaire l’audit initial.

## Objectif

Livrer une démonstration fiable à montrer à des incubateurs et financeurs : dossier horodaté vérifiable, instruction de programme, espace financeur privé et suivi de portefeuille. Ne pas présenter les exemples comme des preuves commerciales ni la conformité réglementaire comme acquise.

## État des dépôts et services

- Source : `C:\Users\pc\Ambition\.claude\worktrees\combine-codex-2026-09-23\projets\combine`, branche locale `codex/combine-ready`.
- Changements du worktree source encore locaux, non commités et non poussés. Source initiale : [PR #1](https://github.com/dosteeve2-hash/ambition/pull/1), ouverte et mergeable au 23/09; sa tête reste `06171cf`. Le workflow COMBINE associé est vert (run #6), mais les derniers durcissements locaux ne sont pas dans cette PR.
- Dépôt dédié `dosteeve2-hash/combine` créé privé. Le connecteur GitHub de Codex confirme `admin/push`, mais le dépôt distant est encore vide (`size: 0`, branche par défaut `main`). La copie locale a été synchronisée et commitée sur `main`, sans push; son hash est consultable avec `git log -1`. Le script local ne peut pas pousser son workflow CI tant que `gh` n’a pas le scope `workflow`.
- Projet Vercel `combine` créé et lié au dépôt, sans variables Production et sans déploiement.
- Aucune connexion, migration ou écriture sur Neon n’a été faite par Codex pendant ce déploiement. La PR #1 indique que Claude avait appliqué le schéma sur une branche Neon et vérifié des requêtes; ce point n’a pas été revérifié. Le `.env.local` actuel contient une URL Postgres de test sur `localhost`, pas l’URL Neon.

## Changements réalisés dans le code

- Les pages publiques ne montrent plus les montants ou le formulaire d’intérêt ; le flux financeur est privé. Une invitation exige une adresse vérifiée correspondante.
- La production impose les e-mails vérifiés. Sans Resend configuré, l’inscription est fermée ; les sessions non vérifiées sont bloquées. Le `.env.local` actuel ne contient qu’une URL Postgres locale de test, pas l’URL Neon réelle.
- La passerelle limite le corps à 16 Ko et chaque dossier/source à 60 requêtes/minute avec compteur atomique Postgres. En Production, l’endpoint est désactivé par défaut jusqu’à configuration d’une protection IP de confiance ; le script retire le flag d’activation et vérifie son absence, sinon il s’arrête.
- Le mot de passe fixe d’accessibilité a été remplacé par une variable locale. Le semeur exige une autorisation explicite et refuse tout hôte distant ; les parcours destructifs E2E refusent aussi toute base ou application distante.
- Le script de déploiement configure Production/Preview et migre avant le push GitHub qui déclenche le build.

## Contrôles et limites

Vérifications finales locales : TypeScript, ESLint, 93 tests unitaires, `npm audit` (0 vulnérabilité), build, syntaxe PowerShell et tests du script de déploiement réussis. Le build utilisait une URL Postgres factice et Better Auth n’a pas pu valider le schéma. Postgres local (`localhost:5432`) est absent, donc aucun parcours E2E ni contrôle navigateur n’a été réalisé. Ne jamais lancer `test:parcours`, `test:a11y` ou le semeur avec l’URL Production.

## Prochaines actions

1. Rejouer TypeScript, lint, tests, audit et build ; corriger toute régression.
2. Faire confirmer à Steve l’élargissement du scope `gh` à `workflow` et la transmission de `DATABASE_URL` à Vercel Production. Ne pas lui demander de coller la chaîne secrète dans le chat ; utiliser la saisie masquée du script.
3. Si des inscriptions réelles sont attendues, configurer Resend en Production. Sinon l’inscription reste fermée.
4. Depuis le worktree source `C:\Users\pc\Ambition\.claude\worktrees\combine-codex-2026-09-23\projets\combine`, exécuter `pwsh -File .\scripts\mise-en-ligne.ps1`. Le mode `-PreparationSeule` synchronise et commit la copie sans réseau, secret, push ou déploiement; cette étape est faite. Le mode déploiement exige le scope `workflow` pour le jeton local `gh` et demande la vraie URL Neon masquée. Vérifier le statut du déploiement avant d’ouvrir l’URL au public.
5. Tester dans un navigateur toutes les pages et les flux autorisés ; tester le mobile 375 px et les erreurs console/réseau. Utiliser un compte existant dont la sécurité a été confirmée ; ne pas diffuser des identifiants partagés.
6. Mettre à jour `C:\Users\pc\.claude\ETAT.md` après chaque jalon.
7. Pour la revue quotidienne demandée à 09:00 Istanbul, créer l’automatisation depuis Agents Window : l’éditeur d’automatisations n’était pas exposé dans ce fil.

## Règles de passation

- Ne jamais mettre de clés, mots de passe, URL Neon ou données privées dans ce fichier, un ticket ou un commit.
- Garder le dépôt privé. Aucun déploiement de production, seeder ou test destructif quotidien.
- Ne pas annoncer « prêt à montrer » avant les parcours réels dans le navigateur.
