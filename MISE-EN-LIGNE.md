# Mise en ligne de COMBINE

> Mis à jour le 23/09/2026. État réel, sans supposer que la production a été testée.

## État actuel

> Mesuré le 26/09/2026. La section précédente datait du 23 et affirmait trois choses
> devenues fausses : que le dépôt distant était vide, qu'aucun déploiement n'avait été
> lancé, et qu'aucun test navigateur n'avait pu tourner.

- **Le code est sur GitHub.** `dosteeve2-hash/combine`, branche `codex/combine-ready`,
  PR #1 ouverte vers `main`. 97 fichiers, ~19 300 lignes. `main` ne porte encore que le
  README : **tant que la PR #1 n'est pas fusionnée, le dépôt paraît vide.**
- **Le scope `workflow` n'est plus un obstacle** : `.github/workflows/verification.yml`
  est sur GitHub et s'exécute à chaque poussée.
- **La CI GitHub est verte** sur `74128f9`, pour la première fois : types, lint,
  93 tests, build, parcours navigateur (70 vérifications) et audit d'accessibilité
  (20 passages d'axe, aucune violation WCAG 2.1 AA).
- **Les tests E2E tournent.** Le runner monte un Postgres 16 en service ; ils ont aussi
  été rejoués sur un Postgres local le 26/09. La phrase « Postgres local est absent »
  ne vaut plus.
- **Vercel est lié au dépôt et déploie déjà.** Trois déploiements existent, et
  **les trois ont échoué** — deux en `ERROR`, un en `BLOCKED`.

### Pourquoi le déploiement Vercel échoue, exactement

Journal de build du déploiement `dpl_7g9VqMnbaw7xToAM4hkZjiniW5Us` :

```
Error: DATABASE_URL est absent. Copie .env.example vers .env.local et renseigne la chaîne Postgres.
    at lib/db.ts:5:9
Error: Failed to collect page data for /api/appel/[id]/export
Error: Command "npm run build" exited with 1
```

**Ce n'est pas un défaut du code.** `lib/db.ts` refuse volontairement de démarrer sans
chaîne de connexion, et Next.js collecte les données de page au build : la route
d'export touche la base, donc le build s'arrête. Le garde-fou fait son travail.

**Il manque donc uniquement les variables d'environnement sur Vercel** — rien d'autre
n'est identifié comme bloquant. Ce sont des actions de production : elles appartiennent
à Steve seul, aucune automatisation ne les pose à sa place.

## Déploiement

Lance le script depuis le worktree source. Il synchronise d’abord le code courant vers `C:\Users\pc\Documents\GitHub\combine`, puis configure les environnements, applique le schéma idempotent, pousse et déploie :

```powershell
Set-Location 'C:\Users\pc\Ambition\.claude\worktrees\combine-codex-2026-09-23\projets\combine'
pwsh -File .\scripts\mise-en-ligne.ps1
```

Pour synchroniser et committer uniquement la copie locale, sans réseau, secret, push ni déploiement :

```powershell
pwsh -File .\scripts\mise-en-ligne.ps1 -PreparationSeule
```

La copie locale est alignée au dernier commit de sa branche `main`, mais le dépôt distant reste vide. Son `.env.local` est absent et n’est pas tracké par Git. Le script source vérifie que `Source` et `Destination` sont deux dossiers distincts avant toute action. Le `.env.local` du worktree source ne contient qu’une URL Postgres de test sur `localhost`, pas une URL Neon; le mode déploiement demandera donc la vraie URL en saisie masquée.

Le script conserve le dépôt privé et n’envoie pas la base Production aux déploiements Preview. Preview reçoit une URL Postgres locale factice et un secret Better Auth distinct. En mode déploiement, l’URL Neon valide est lue depuis `.env.local` ou demandée en saisie masquée, puis transmise seulement à Vercel Production ; elle n’est ni affichée ni copiée dans Git. Sans les deux variables Resend, l’inscription réelle reste fermée.

Avant le push, le script configure l’environnement Production, applique `db/schema.sql` (créations et ajouts idempotents), puis pousse le code. Ainsi, le build Vercel déclenché par GitHub ne démarre pas avant la configuration des secrets et du schéma.

Le push nécessite le scope `workflow` pour `gh`. Si Steve choisit d’élargir l’autorisation locale :

```powershell
gh auth refresh -h github.com -s workflow
```

La vérification d’e-mail exige les deux variables Resend (`RESEND_API_KEY` et `RESEND_FROM_EMAIL`) en Production. Sans elles, l’inscription est fermée et toute session non vérifiée est bloquée. Les Preview n’obtiennent ni Resend ni la base réelle.

La route de la passerelle est désactivée en Production par défaut : les jetons invalides n’atteignent donc pas Postgres. Le quota local est partagé par dossier/source, même après rotation d’un jeton. Le script lit les variables Vercel, retire le flag d’activation et s’arrête s’il ne peut pas confirmer son absence. N’activer `COMBINE_PASSERELLE_ACTIVE` qu’après avoir mis en place une limitation IP de confiance.

## Contrôles après déploiement

Ne pas annoncer le prototype comme prêt avant le navigateur réel : accueil, tarifs, cadre légal, connexion, dossier public, accès privé investisseur, vérification d’adresse, responsive à 375 px, console et erreurs réseau. Les suites `test:parcours` et `test:a11y` modifient leur base et ne doivent jamais viser Production.

Le semeur de démo exige `COMBINE_ALLOW_DEMO_SEED=true` et un mot de passe local fourni par `COMBINE_DEMO_PASSWORD`. Il refuse `NODE_ENV=production` et toute connexion distante. Les parcours E2E vérifient eux aussi que la base et l’application ciblées sont locales avant de lancer le scénario destructif.

## Critères de partage

- Le parcours réel passe sur l’URL Vercel et les sessions sont correctement vérifiées.
- Les exemples sont identifiés comme fictifs ; les identifiants ne sont pas publiés.
- Les montants et actions financières restent derrière l’accès privé.
- Toute offre financière réelle est examinée par un conseil qualifié avant sa diffusion.
