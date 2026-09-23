Warning: truncated output (original token count: 4041)
Total output lines: 299

# COMBINE — du prototype au capital

> La plateforme qui relie les porteurs de projets africains, les incubateurs qui les
> accompagnent et les financeurs qui les cherchent.
>
> Un produit **FORGE Afrika** · Steve Donald Compaoré

---

## Le problème

Des milliers de projets africains fonctionnent déjà et ne trouvent pourtant pas un franc. Ce
n'est presque jamais la qualité qui bloque, c'est l'absence d'un dossier qu'un financeur puisse
ouvrir, comprendre et **vérifier**.

Trois douleurs distinctes, une seule cause :

| Qui | Ce qui fait mal |
|---|---|
| **Le porteur** | On lui demande un « business plan » sans jamais lui montrer le contenu attendu. |
| **L'incubateur** | Candidatures dans un formulaire, notes dans un tableur, échanges dans WhatsApp — et le rapport bailleur reconstitué à la main chaque trimestre. |
| **Le financeur** | Les chiffres qu'on lui présente ont été écrits la veille du rendez-vous. Rien ne prouve qu'ils existaient avant. |

## Ce que COMBINE fait

**Trois portes, un seul dossier.**

- **Porteur** — monte son dossier par sections, voit un **score de préparation** qui nomme
  précisément ce qui manque, et publie un **lien public vérifiable** (`/dossier/<code>`).
- **Incubateur, fonds, agence** — ouvre des **appels à candidatures**, reçoit des dossiers déjà
  instruits, les évalue sur une **grille partagée**, décide, et **exporte son rapport bailleur**.
- **Financeur invité** — accède à l’espace privé, parcourt les dossiers publiés dans le flux
  et peut signaler son intérêt. La suite se passe directement entre lui et le porteur.

Et deux briques qui font de COMBINE l'outil d'exploitation d'un fonds, pas seulement un outil
d'instruction :

- **Portefeuille** (`/portefeuille`) — les prises de participation, leur instrument, leur
  valorisation dans le temps, le multiple. Une valorisation **s'ajoute**, elle n'écrase pas :
  on montre la trajectoire, pas seulement le dernier chiffre. La règle est prudente — sans
  valorisation constatée une ligne vaut ce qu'elle a coûté, une ligne perdue vaut zéro.
  **Aucune plus-value n'est supposée.**
- **Espace investisseur** — accès en lecture seule au portefeuille, par **invitation nominative**
  vérifiée sur l'adresse e-mail. Ni page publique, ni indexation (voir « Aucun franc » ci-dessous).

## Le dossier vérifiable — ce qui nous distingue

Publier fige le contenu, l'horodate avec l'heure du **serveur** et calcule son empreinte SHA-256.
La publication suivante n'efface pas la précédente : **elle s'ajoute**.

Un interlocuteur autorisé ne voit donc pas seulement vos chiffres, il voit **depuis quand vous les tenez**.

| Certifié par COMBINE | Reste déclaratif |
|---|---|
| Qu'un contenu identique a été déposé à cette date | L'exactitude des chiffres eux-mêmes |
| Que l'historique n'a pas été réécrit après coup | COMBINE n'audite pas les comptes |

C'est la même idée que le *passeport du cheptel* de LivestockOS, appliquée à une entreprise.

## Limites de la plateforme

COMBINE est un logiciel de préparation et de suivi. Il ne reçoit, ne détient et ne transfère pas
les fonds d’un investisseur, et ne conclut aucune transaction financière. Cela décrit le produit;
cela ne détermine pas à lui seul le régime applicable à une opération menée par ses utilisateurs.

Les informations de financement et les actions de prise de contact sont réservées aux membres
investisseurs dont l’adresse e-mail est vérifiée et qui ont rejoint une structure sur invitation.
Les liens de dossier servent à vérifier l’historique publié; ils ne montrent pas le montant
recherché et ne proposent pas de prise de contact financière. Le répertoire `/flux` est privé.

Une invitation nominative, un nombre limité de destinataires ou une page en `noindex` ne constitue
pas une preuve d’exemption réglementaire. L’AMF-UMOA décrit notamment le visa applicable aux offres
au public; toute opération réelle doit être examinée par un conseil qualifié dans les pays concernés
avant diffusion ou collecte. COMBINE ne fournit ni conseil juridique ni conseil en investissement.
Voir `/cadre-legal`.

## La passerelle FORGE

Un porteur qui tient déjà ses chiffres dans AgroTrack, LivestockOS ou CompTrack ne les retape pas :
il génère un jeton dans COMBINE, le colle dans l'autre application, et ses chiffres réels arrivent
datés. Le jeton n'est stocké qu'en **empreinte SHA-256** et n'est affiché qu'une fois.

Rien n'est appliqué automatiquement : chaque envoi est présenté au porteur, qui décide de le
reprendre. Une application extérieure alimente son dossier, elle ne le réécrit pas dans son dos.

```
POST /api/passerelle
Authorization: Bearer cmb_…
{ "source": "livestockos", "ca_mensuel_fcfa": 450000, "clients_actifs": 12, "employes": 4 }
```

C'est le seul avantage de COMBINE qu'un concurrent ne peut pas copier : il lui faudrait posséder
aussi les applications d'en face.

## Le modèle

Gratuit pour les porteurs. Payant pour les structures dont l'accompagnement est le métier.

| Plan | Pour qui | Prix | Bornes |
|---|---|---|---|
| **Essai** | Voir si l'outil convient | Gratuit | 1 appel · 10 dossiers · 2 membres |
| **Programme** | Un incubateur, une cohorte | **45 000 FCFA/mois** · 450 000/an | 3 appels · 40 dossiers/appel · 5 membres · export bailleur |
| **Institution** | Un fonds, un réseau, une agence | **150 000 FCFA/mois** | Illimité · multi-pays · marque blanche |

Les limites sont vérifiées **côté serveur** (`lib/plans.ts`, `app/actions/`), jamais seulement
dans l'interface.

---

## Pile technique

| | |
|---|---|
| Cadre | Next.js 16 (App Router, Server Components, Server Actions) |
| Langage | TypeScript strict — ni `any`, ni `@ts-ignore` |
| Style | Tailwind CSS v4 + charte graphique SDC (`app/globals.css`) |
| Base | Neon Postgres, requêtes SQL paramétrées via `@neondatabase/serverless` |
| Auth | Better Auth (e-mail + mot de passe, sessions 30 jours, vérification d’e-mail activée avec Resend) |
| Validation | Zod, côté serveur systématiquement |
| Déploiement | Vercel |

Aucun ORM : les requêtes sont écrites en SQL, paramétrées par les gabarits balisés — donc
protégées contre l'injection, et lisibles sans traduction mentale.

## Mise en route

```bash
npm install
cp .env.example .env.local     # renseigner DATABASE_URL et BETTER_AUTH_SECRET
npm run db:migrer              # applique db/schema.sql (idempotent)
npm run dev
```

**N'importe quel Postgres fait l'affaire.** `lib/db.ts` regarde l'hôte de `DATABASE_URL` :
sur `*.neon.tech` il parle le protocole HTTP de Neon (pas de pool à entretenir, ce qui
convient au serverless), partout ailleurs il repasse sur le pilote `pg`. Les deux exposent
le même gabarit balisé, donc le code applicatif ignore lequel tourne — et on peut
développer hors ligne :

```bash
pg_createcluster 16 main --start
su postgres -c "psql -c \"create role combine login password 'combine_local'\""
su postgres -c "createdb -O combine combine"
# DATABASE_URL="postgresql://combine:combine_local@127.0.0.1:5432/combine"
```

Générer le secret de session :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Variables d'environnement

| Nom | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion Neon (avec `sslmode=require`) |
| `BETTER_AUTH_SECRET` | Secret de signature des sessions — 32 octets aléatoires |
| `BETTER_AUTH_URL` | URL publique de l'application |
| `RESEND_API_KEY` | Facultative — active l’envoi des liens de vérification par Resend |
| `RESEND_FROM_EMAIL` | Facultative — adresse expéditrice vérifiée chez Resend, à configurer avec la clé |

Sans les deux variables Resend, l’inscription fonctionne pour …41 tokens truncated…xistants doivent rester privés et leurs identifiants ne sont jamais publiés dans
ce dépôt.

## Activer un abonnement

Tant que les clients se comptent sur les doigts d'une main, le paiement se fait hors ligne
(Orange Money, Moov Money, virement) et l'activation passe par un script :

```bash
npm run plan:activer -- "La Fabrique" programme 12 "OM-20260922-4471"
#                        ^structure    ^plan      ^mois ^référence
```

Le script prolonge à partir de l'échéance en cours si l'abonnement court encore — un client qui
renouvelle en avance ne perd rien.

## Structure

```
app/
  (site)/              pages publiques et espace connecté (en-tête + pied communs)
    page.tsx           accueil
    flux/              le flux des dossiers publiés
    dossier/[code]/    la page publique vérifiable
    tableau-de-bord/   espace du porteur + éditeur de dossier
    programme/         espace de la structure : appels, évaluations, export
    tarifs/ cadre-legal/
  (auth)/              connexion, inscription
  actions/             Server Actions — toutes les mutations passent ici
  api/
    auth/[...all]/         Better Auth
    appel/[id]/export/     export CSV du rapport bailleur (plan payant)
components/            composants partagés
lib/
  brand.ts             nom, pays, secteurs, stades
  plans.ts             les plans et leurs bornes
  score.ts             le calcul du score de préparation
  db.ts                connexion, identifiants, empreinte SHA-256
  auth.ts session.ts   authentification et garde-fous
db/
  schema.sql           le schéma complet
  migrer.mjs           l'applique
scripts/
  activer-plan.mjs     activation manuelle d'un abonnement
```

## Tests

```bash
npm run verifier        # typecheck + lint + tests + build — tout doit être vert
npm test                # tests unitaires sur la logique pure
npm run test:parcours   # parcours Playwright sur une base dédiée remise à zéro
npm run test:a11y       # WCAG 2.1 AA — axe-core sur 19 pages, 0 violation exigée
```

`test:parcours` réinitialise sa base et `test:a11y` lit des comptes de démonstration. Les deux
commandes refusent toute base ou URL d’application distante : utilise uniquement `localhost`, une
IP loopback ou un hôte de test local.

Pour une base locale ou de test dédiée, le semeur de données exige `COMBINE_ALLOW_DEMO_SEED=true`
et `COMBINE_DEMO_PASSWORD` (16 caractères minimum) dans le `.env.local` ignoré par Git. Il refuse
`NODE_ENV=production` et toute connexion à un hôte distant, ne contient plus de mot de passe par défaut
et ne l’affiche pas. N’utilise jamais ce semeur sur la base de production. `test:a11y` exige aussi
`COMBINE_DEMO_PASSWORD` pour se connecter aux comptes de démonstration.

En Production, la création de compte est désactivée tant que Resend n’est pas configuré. Les sessions
et les écritures côté serveur exigent une adresse vérifiée. La passerelle FORGE est désactivée par
défaut en Production tant qu’une limitation IP de confiance n’est pas configurée. En local, elle
plafonne les corps à 16 Ko et chaque dossier/source à 60 requêtes par minute, avec un compteur Postgres
partagé qui résiste au renouvellement de jetons.

**Les tests unitaires** (`tests/`) couvrent ce qui décide : le calcul du score et ses
seuils, les bornes des plans et le repli `planActif` (un plan expiré ou sans échéance
retombe toujours sur le moins permissif), la valorisation d'une participation (aucune
plus-value supposée, une ligne perdue vaut zéro), l'unicité et l'alphabet des
identifiants, et le fait qu'un jeton de passerelle ne soit jamais déductible de son
empreinte.

**L'audit d'accessibilité** (`e2e/accessibilite.mjs`) passe axe-core sur les pages
publiques, l'espace porteur et l'espace structure, en 1280 px et en 375 px, avec les
règles `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` et les bonnes pratiques. Il mesure
aussi le débordement horizontal à 375 px, qu'axe ne voit pas et qui rend pourtant une
page inutilisable sur un Android d'entrée de gamme (filtre 3 de la doctrine). Il sème la
cohorte de démonstration avant de mesurer : une page vide ne prouve rien.

**Le parcours navigateur** (`e2e/parcours.mjs`) rejoue ce qu'un utilisateur fait vraiment,
avec Playwright et Chromium, sur une base remise à zéro : inscription, montage du dossier
avec le score qui monte, publication, republication qui **ajoute** sans écraser, page
publique ouverte en navigation anonyme — en vérifiant que l'e-mail du porteur n'apparaît
**ni à l'écran ni dans le HTML** —, flux et filtres, structure, appel, limite de plan,
export refusé en 402, candidature, évaluation, décision, intérêt d'un financeur,
portefeuille, invitation nominative en `noindex`, absence de débordement horizontal à
375 px, et zéro erreur console.

> C'est ce parcours qui a trouvé le seul bug visuel de la v1 : `.bouton { display: inline-flex }`
> étant déclaré après Tailwind, il écrasait l'utilitaire `hidden` — le bouton « Se connecter »
> restait visible sur mobile et débordait de 19 px. Les classes maison vivent désormais dans
> `@layer components`, sous les utilitaires.

### Ce qu'une revue de sécurité a corrigé

Trois failles trouvées et fermées avant la première mise en ligne, chacune avec son test :

| Faille | Ce qui était possible | Correction |
|---|---|---|
| **Injection de formule dans l'export** | Un candidat nommait son entreprise `=cmd\|'/C …'!A1` ; l'incubateur ouvrait le CSV dans Excel et exécutait la commande | `lib/csv.ts` préfixe toute cellule commençant par `=`, `+`, `-`, `@`, tabulation ou retour chariot |
| **Un investisseur pouvait piloter le programme** | Le rôle `investisseur` n'était filtré que dans la navigation : en tapant l'URL, il lisait les dossiers en instruction, téléchargeait l'export et pouvait **écarter une candidature** | `exigerGestionnaire()` dans `lib/session.ts`, appliqué aux quatre actions de programme, aux deux pages et à la route d'export |
| **Contournement des quotas** | Fermer puis rouvrir un appel en boucle donnait des appels ouverts illimités sur le plan gratuit ; `candidaturesParAppel` n'était jamais appliqué | Le quota est revérifié à la réouverture, et le plan de la structure qui a ouvert l'appel borne le nombre de dossiers reçus |
| **Usurpation d’une invitation** | Un compte non vérifié pouvait réclamer une invitation adressée à l’e-mail d’une autre personne | L’acceptation exige la vérification de la même adresse que celle invitée ; la vérification par e-mail utilise Resend quand il est configuré |

> La leçon, valable pour tout l'écosystème : **cacher un lien n'est pas un contrôle d'accès.**

## Sécurité

- En-têtes `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` et HSTS
  (`next.config.ts`)
- Validation Zod côté serveur sur toutes les mutations
- Toutes les requêtes paramétrées — aucune concaténation de chaîne SQL
- Chaque Server Action revérifie la propriété de la ressource (`user_id`, `organisation_id`)
- Les limites de plan sont appliquées côté serveur
- Les coordonnées d'un porteur ne sont jamais affichées sur la page publique

## Ce qui reste à faire

- [ ] **Le premier client.** Un incubateur nommé, avec un prénom. C'est le seul point bloquant.
- [ ] Invitation de plusieurs membres dans une structure (le schéma le prévoit, l'écran manque)
- [ ] Notification par e-mail à la réception d'un intérêt ou d'une candidature
- [ ] Pièces jointes au dossier (RCCM, états financiers) via un stockage objet
- [ ] Import des données d'exploitation depuis AgroTrack, LivestockOS et CompTrack — c'est
      l'avantage que personne d'autre ne peut copier

---

*FORGE Afrika — l'infrastructure logicielle de l'industrialisation africaine.*

