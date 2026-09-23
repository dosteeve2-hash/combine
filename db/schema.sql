-- COMBINE — schéma Postgres (Neon)
-- Les quatre premières tables sont celles attendues par Better Auth : noms de colonnes
-- en camelCase, donc entre guillemets. Ne pas les renommer.

-- ---------------------------------------------------------------- authentification

create table if not exists "user" (
  "id"            text primary key,
  "name"          text not null,
  "email"         text not null unique,
  "emailVerified" boolean not null default false,
  "image"         text,
  "role"          text default 'porteur',
  "createdAt"     timestamp not null default now(),
  "updatedAt"     timestamp not null default now()
);

create table if not exists "session" (
  "id"        text primary key,
  "expiresAt" timestamp not null,
  "token"     text not null unique,
  "ipAddress" text,
  "userAgent" text,
  "userId"    text not null references "user"("id") on delete cascade,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

create table if not exists "account" (
  "id"                    text primary key,
  "accountId"             text not null,
  "providerId"            text not null,
  "userId"                text not null references "user"("id") on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope"                 text,
  "password"              text,
  "createdAt"             timestamp not null default now(),
  "updatedAt"             timestamp not null default now()
);

create table if not exists "verification" (
  "id"         text primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamp not null,
  "createdAt"  timestamp default now(),
  "updatedAt"  timestamp default now()
);

create index if not exists session_user_idx on "session" ("userId");
create index if not exists account_user_idx on "account" ("userId");

-- ------------------------------------------------------------------ organisations
-- Une organisation est un incubateur, un fonds, une agence ou un réseau d'investisseurs.
-- C'est elle qui porte l'abonnement : le porteur de projet ne paie jamais.

create table if not exists organisation (
  id             text primary key,
  nom            text not null,
  pays           text not null,
  type           text not null default 'incubateur',
  plan           text not null default 'essai',
  plan_expire_le timestamptz,
  plan_reference text,
  cree_le        timestamptz not null default now()
);

create table if not exists membre (
  id              text primary key,
  organisation_id text not null references organisation(id) on delete cascade,
  user_id         text not null references "user"("id") on delete cascade,
  role            text not null default 'membre',
  cree_le         timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create index if not exists membre_user_idx on membre (user_id);

-- ------------------------------------------------------------------------ dossiers

create table if not exists dossier (
  id                     text primary key,
  user_id                text not null references "user"("id") on delete cascade,
  nom                    text not null,
  secteur                text not null default '',
  pays                   text not null default '',
  ville                  text,
  stade                  text not null default 'idee',
  resume                 text,
  probleme               text,
  solution               text,
  clients                text,
  modele                 text,
  concurrence            text,
  equipe_taille          integer,
  equipe_description     text,
  annee_creation         integer,
  formalise              boolean not null default false,
  ca_mensuel_fcfa        bigint,
  clients_actifs         integer,
  croissance_commentaire text,
  besoin_fcfa            bigint,
  usage_des_fonds        text,
  contrepartie           text,
  contact_nom            text,
  contact_email          text,
  contact_telephone      text,
  code_public            text unique,
  publie                 boolean not null default false,
  cree_le                timestamptz not null default now(),
  maj_le                 timestamptz not null default now()
);

create index if not exists dossier_user_idx on dossier (user_id);
create index if not exists dossier_publie_idx on dossier (publie) where publie;

-- L'historique des publications. On n'écrase jamais une ligne : on en ajoute une.
-- C'est ce qui rend le dossier vérifiable par un tiers — le contenu est figé et
-- l'horodatage vient du serveur, pas du navigateur du porteur.

create table if not exists publication (
  id         text primary key,
  dossier_id text not null references dossier(id) on delete cascade,
  version    integer not null,
  score      integer not null,
  empreinte  text not null,
  contenu    jsonb not null,
  publie_le  timestamptz not null default now(),
  unique (dossier_id, version)
);

create index if not exists publication_dossier_idx on publication (dossier_id, version desc);

-- --------------------------------------------------------- appels à candidatures

create table if not exists appel (
  id              text primary key,
  organisation_id text not null references organisation(id) on delete cascade,
  titre           text not null,
  description     text,
  secteurs        text[],
  pays            text[],
  score_minimum   integer not null default 0,
  ferme_le        date,
  statut          text not null default 'brouillon',
  cree_le         timestamptz not null default now()
);

create index if not exists appel_org_idx on appel (organisation_id);
create index if not exists appel_ouvert_idx on appel (statut) where statut = 'ouvert';

create table if not exists candidature (
  id         text primary key,
  appel_id   text not null references appel(id) on delete cascade,
  dossier_id text not null references dossier(id) on delete cascade,
  statut     text not null default 'recue',
  decide_le  timestamptz,
  cree_le    timestamptz not null default now(),
  unique (appel_id, dossier_id)
);

create index if not exists candidature_appel_idx on candidature (appel_id);

create table if not exists evaluation (
  id              text primary key,
  candidature_id  text not null references candidature(id) on delete cascade,
  user_id         text not null references "user"("id") on delete cascade,
  equipe          integer,
  probleme        integer,
  traction        integer,
  modele          integer,
  impact          integer,
  commentaire     text,
  cree_le         timestamptz not null default now(),
  unique (candidature_id, user_id)
);

-- ---------------------------------------------------------------------- intérêts
-- Un financeur marque son intérêt pour un dossier. C'est une mise en relation,
-- rien d'autre : aucun montant, aucun engagement, aucun flux financier.
-- Cette limite est volontaire — cf. AMF-UMOA, appel public à l'épargne.

create table if not exists interet (
  id         text primary key,
  dossier_id text not null references dossier(id) on delete cascade,
  user_id    text not null references "user"("id") on delete cascade,
  message    text,
  cree_le    timestamptz not null default now(),
  unique (dossier_id, user_id)
);

create index if not exists interet_dossier_idx on interet (dossier_id);

-- ------------------------------------------------------------------ portefeuille
-- Les prises de participation de la structure dans les entreprises qu'elle accompagne.
-- C'est ce qui fait de COMBINE l'outil d'exploitation d'un fonds, et pas seulement
-- un outil d'instruction de dossiers.

create table if not exists participation (
  id                       text primary key,
  organisation_id          text not null references organisation(id) on delete cascade,
  dossier_id               text not null references dossier(id) on delete cascade,
  instrument               text not null default 'equity',
  montant_fcfa             bigint not null default 0,
  pourcentage              numeric(5,2),
  valorisation_entree_fcfa bigint,
  date_entree              date not null default current_date,
  statut                   text not null default 'active',
  notes                    text,
  cree_le                  timestamptz not null default now(),
  unique (organisation_id, dossier_id)
);

create index if not exists participation_org_idx on participation (organisation_id);

-- Une valorisation ne remplace jamais la précédente : elle s'ajoute. Même principe que
-- les publications de dossier — on peut montrer la trajectoire, pas seulement le dernier chiffre.

create table if not exists valorisation (
  id              text primary key,
  participation_id text not null references participation(id) on delete cascade,
  valeur_fcfa     bigint not null,
  ca_mensuel_fcfa bigint,
  employes        integer,
  commentaire     text,
  constatee_le    date not null default current_date,
  cree_le         timestamptz not null default now()
);

create index if not exists valorisation_part_idx on valorisation (participation_id, constatee_le desc);

-- ------------------------------------------------------------------- invitations
-- L'accès investisseur se donne nominativement, jamais par un lien public.
-- Dans l'UEMOA une opération reste un placement privé tant qu'elle est faite SANS PUBLICITÉ
-- auprès d'un cercle de moins de cent personnes (art. 19 de l'annexe à la convention CREPMF,
-- instruction n° 30/2001). C'est la publicité qui requalifie, pas le montant.

create table if not exists invitation (
  id              text primary key,
  organisation_id text not null references organisation(id) on delete cascade,
  email           text not null,
  role            text not null default 'investisseur',
  code            text not null unique,
  invite_par      text references "user"("id") on delete set null,
  acceptee_le     timestamptz,
  expire_le       timestamptz not null default (now() + interval '30 days'),
  cree_le         timestamptz not null default now()
);

create index if not exists invitation_org_idx on invitation (organisation_id);
create index if not exists invitation_email_idx on invitation (lower(email));

-- -------------------------------------------------------------- passerelle FORGE
-- Un porteur qui tient déjà ses chiffres dans AgroTrack, LivestockOS ou CompTrack
-- génère un jeton et le colle dans l'autre application. Seule l'empreinte SHA-256 du
-- jeton est conservée : une fuite de la base ne permet pas de s'en servir.

create table if not exists jeton_passerelle (
  id               text primary key,
  dossier_id       text not null references dossier(id) on delete cascade,
  source           text not null,
  jeton_empreinte  text not null unique,
  dernier_usage_le timestamptz,
  revoque          boolean not null default false,
  cree_le          timestamptz not null default now()
);

create index if not exists jeton_dossier_idx on jeton_passerelle (dossier_id);

-- Le compartiment est partagé par dossier/source : renouveler un jeton ne
-- réinitialise pas le quota et les instances serverless voient le même compteur.
create table if not exists limite_passerelle (
  dossier_id text not null references dossier(id) on delete cascade,
  source text not null,
  fenetre timestamptz not null default date_trunc('minute', now()),
  requetes integer not null default 0 check (requetes >= 0),
  primary key (dossier_id, source)
);

-- Un envoi reçu n'est jamais appliqué automatiquement : le porteur le voit et décide.
-- Une application extérieure alimente son dossier, elle ne le réécrit pas dans son dos.

create table if not exists import_passerelle (
  id         text primary key,
  dossier_id text not null references dossier(id) on delete cascade,
  source     text not null,
  charge     jsonb not null,
  applique   boolean not null default false,
  cree_le    timestamptz not null default now()
);

create index if not exists import_dossier_idx on import_passerelle (dossier_id, cree_le desc);
