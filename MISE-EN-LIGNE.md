# Mise en ligne de COMBINE

> Mis à jour le 23/09/2026. État réel, sans supposer que la production a été testée.

## État actuel

- Code local : `codex/combine-ready`, dans `C:\Users\pc\Ambition\.claude\worktrees\combine-codex-2026-09-23\projets\combine`.
- Le dépôt privé `dosteeve2-hash/combine` a été créé. La copie locale `C:\Users\pc\Documents\GitHub\combine` a été synchronisée et commitée sur `main`; ce commit n’a pas été poussé, et le dépôt distant est toujours vide. Le hash courant est visible avec `git log -1` dans cette copie.
- Le push GitHub a échoué car l’autorisation OAuth locale de `gh` n’inclut pas le scope `workflow`, requis pour publier `.github/workflows/verification.yml`.
- Le projet Vercel `combine` existe et est lié au dépôt GitHub, mais aucun secret n’y a été transféré et aucun déploiement n’a été lancé.
- La base Neon mentionnée dans les notes Claude n’a pas été contactée. Aucune migration, réinitialisation ni écriture n’a été faite.
- Vérifications finales locales : TypeScript, ESLint, 93 tests unitaires, `npm audit` (0 vulnérabilité), build, syntaxe PowerShell et tests du script de déploiement réussis.
- Le build utilisait une URL Postgres factice et Better Auth a signalé qu’il ne pouvait pas valider le schéma : il ne valide pas la connexion Neon ni le parcours d’authentification.
- Aucun test E2E sur base locale ou navigateur n’a pu être lancé ; Postgres local est absent.

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
