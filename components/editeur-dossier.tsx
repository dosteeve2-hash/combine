'use client';

import {
  cloneElement,
  isValidElement,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react';
import { enregistrerDossier, publierDossier, type Resultat } from '@/app/actions/dossier';
import { calculerScore } from '@/lib/score';
import { SCORE_PUBLICATION } from '@/lib/plans';
import { CONTREPARTIES, PAYS, SECTEURS, STADES } from '@/lib/brand';
import { PanneauScore } from './panneau-score';
import type { Dossier } from '@/lib/types';

type Valeurs = Record<string, string | boolean>;

const CHAMPS_TEXTE = [
  'nom', 'secteur', 'pays', 'ville', 'stade', 'resume', 'probleme', 'solution', 'clients',
  'modele', 'concurrence', 'equipe_taille', 'equipe_description', 'annee_creation',
  'ca_mensuel_fcfa', 'clients_actifs', 'croissance_commentaire', 'besoin_fcfa',
  'usage_des_fonds', 'contrepartie', 'contact_nom', 'contact_email', 'contact_telephone',
] as const;

function valeursInitiales(dossier: Dossier | null, defauts: { nom: string; email: string }): Valeurs {
  const v: Valeurs = {};
  for (const c of CHAMPS_TEXTE) {
    const brut = dossier ? (dossier as unknown as Record<string, unknown>)[c] : null;
    v[c] = brut === null || brut === undefined ? '' : String(brut);
  }
  v.formalise = dossier?.formalise ?? false;
  if (!dossier) {
    v.stade = 'idee';
    v.contact_nom = defauts.nom;
    v.contact_email = defauts.email;
  }
  return v;
}

const CLE_BROUILLON = 'combine:brouillon-dossier';

/** Le brouillon ne change pas sous nos pieds : aucun abonnement à installer. */
const abonnementVide = () => () => {};

function lireBrouillonPresent(): boolean {
  try {
    return localStorage.getItem(CLE_BROUILLON) !== null;
  } catch {
    return false;
  }
}

interface Props {
  dossier: Dossier | null;
  utilisateur: { nom: string; email: string };
}

export function EditeurDossier({ dossier, utilisateur }: Props) {
  const [v, setV] = useState<Valeurs>(() =>
    valeursInitiales(dossier, { nom: utilisateur.nom, email: utilisateur.email }),
  );
  const [brouillonTraite, setBrouillonTraite] = useState(false);

  const [etatEnregistrement, actionEnregistrer, enregistrementEnCours] = useActionState<
    Resultat | null,
    FormData
  >(enregistrerDossier, null);
  const [etatPublication, actionPublier, publicationEnCours] = useActionState<
    Resultat | null,
    FormData
  >(publierDossier, null);

  // Y a-t-il un brouillon local ? Lu sans effet, donc sans rendu en cascade.
  const brouillonPresent = useSyncExternalStore(
    abonnementVide,
    lireBrouillonPresent,
    () => false,
  );

  // Sauvegarde continue : sur une connexion qui saute, rien n'est perdu.
  useEffect(() => {
    if (dossier) return;
    try {
      localStorage.setItem(CLE_BROUILLON, JSON.stringify(v));
    } catch {
      /* stockage indisponible : on continue sans brouillon */
    }
  }, [v, dossier]);

  useEffect(() => {
    if (etatEnregistrement?.ok && !dossier) {
      try {
        localStorage.removeItem(CLE_BROUILLON);
      } catch {
        /* ignoré */
      }
    }
  }, [etatEnregistrement, dossier]);

  // La restauration est une décision du porteur, jamais une surprise : on ne remplace
  // pas ce qu'il a sous les yeux sans qu'il l'ait demandé.
  function restaurerBrouillon() {
    try {
      const brut = localStorage.getItem(CLE_BROUILLON);
      if (brut) setV((actuel) => ({ ...actuel, ...(JSON.parse(brut) as Valeurs) }));
    } catch {
      /* ignoré */
    }
    setBrouillonTraite(true);
  }

  const { total, criteres } = useMemo(() => calculerScore(v as unknown as Partial<Dossier>), [v]);
  const set = (cle: string) => (e: { target: { value: string } }) =>
    setV((actuel) => ({ ...actuel, [cle]: e.target.value }));

  const publiable = total >= SCORE_PUBLICATION && Boolean(dossier);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <form action={actionEnregistrer} className="space-y-8">
        {dossier && <input type="hidden" name="id" value={dossier.id} />}

        {!dossier && brouillonPresent && !brouillonTraite && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 px-4 py-3.5">
            <p className="text-sm text-[var(--cyan)]">
              Un brouillon non envoyé a été retrouvé sur cet appareil.
            </p>
            <div className="flex gap-2">
              <button type="button" className="bouton bouton-contour" onClick={restaurerBrouillon}>
                <RotateCcw size={14} aria-hidden /> Le reprendre
              </button>
              <button
                type="button"
                className="bouton bouton-discret"
                onClick={() => setBrouillonTraite(true)}
              >
                Ignorer
              </button>
            </div>
          </div>
        )}

        <Section titre="Identité du projet" numero="01">
          <Champ label="Nom du projet" obligatoire>
            <input
              name="nom"
              className="champ"
              value={String(v.nom)}
              onChange={set('nom')}
              placeholder="Ferme avicole Tanguy"
              maxLength={120}
              required
            />
          </Champ>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Secteur">
              <select name="secteur" className="champ" value={String(v.secteur)} onChange={set('secteur')}>
                <option value="">Choisir…</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Pays">
              <select name="pays" className="champ" value={String(v.pays)} onChange={set('pays')}>
                <option value="">Choisir…</option>
                {PAYS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Champ>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Ville">
              <input
                name="ville"
                className="champ"
                value={String(v.ville)}
                onChange={set('ville')}
                placeholder="Bobo-Dioulasso"
              />
            </Champ>
            <Champ label="Année de démarrage">
              <input
                name="annee_creation"
                className="champ"
                inputMode="numeric"
                value={String(v.annee_creation)}
                onChange={set('annee_creation')}
                placeholder="2024"
              />
            </Champ>
          </div>

          <Champ label="Stade d’avancement">
            <div className="grid gap-2 sm:grid-cols-2">
              {STADES.map((s) => (
                <label
                  key={s.valeur}
                  className="flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors"
                  style={{
                    borderColor: v.stade === s.valeur ? 'var(--gold3)' : 'var(--border)',
                    background: v.stade === s.valeur ? 'var(--bg3)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="stade"
                    value={s.valeur}
                    checked={v.stade === s.valeur}
                    onChange={set('stade')}
                    className="mt-1 accent-[var(--gold)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{s.libelle}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--text3)]">
                      {s.aide}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Champ>

          <Champ
            label="Résumé"
            aide="Une ou deux phrases. C’est la première chose qu’un financeur lira — dites le résultat que vous produisez, pas la technologie."
          >
            <textarea
              name="resume"
              className="champ"
              rows={3}
              value={String(v.resume)}
              onChange={set('resume')}
              maxLength={400}
              placeholder="Nous produisons et livrons 4 000 œufs par semaine aux boulangeries de Bobo-Dioulasso, à un prix stable toute l’année."
            />
          </Champ>
        </Section>

        <Section titre="Problème & solution" numero="02">
          <Champ label="Quel problème résolvez-vous ?" aide="Qui souffre, de quoi, et combien ça lui coûte.">
            <textarea
              name="probleme"
              className="champ"
              rows={4}
              value={String(v.probleme)}
              onChange={set('probleme')}
              maxLength={2000}
            />
          </Champ>
          <Champ label="Votre solution">
            <textarea
              name="solution"
              className="champ"
              rows={4}
              value={String(v.solution)}
              onChange={set('solution')}
              maxLength={2000}
            />
          </Champ>
          <Champ
            label="Qui est votre client ?"
            aide="Un rôle précis, pas un secteur. « Le gérant d’une boulangerie de quartier », pas « les PME »."
          >
            <textarea
              name="clients"
              className="champ"
              rows={3}
              value={String(v.clients)}
              onChange={set('clients')}
              maxLength={1000}
            />
          </Champ>
        </Section>

        <Section
          titre="Preuve & traction"
          numero="03"
          note="C’est la section que presque personne ne remplit, et c’est celle qui décide. Des chiffres petits mais vrais valent mieux que des projections."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Chiffre d’affaires mensuel (FCFA)">
              <input
                name="ca_mensuel_fcfa"
                className="champ mono"
                inputMode="numeric"
                value={String(v.ca_mensuel_fcfa)}
                onChange={set('ca_mensuel_fcfa')}
                placeholder="450000"
              />
            </Champ>
            <Champ label="Clients ou utilisateurs actifs">
              <input
                name="clients_actifs"
                className="champ mono"
                inputMode="numeric"
                value={String(v.clients_actifs)}
                onChange={set('clients_actifs')}
                placeholder="12"
              />
            </Champ>
          </div>
          <Champ label="Comment ces chiffres ont évolué">
            <textarea
              name="croissance_commentaire"
              className="champ"
              rows={3}
              value={String(v.croissance_commentaire)}
              onChange={set('croissance_commentaire')}
              maxLength={1500}
              placeholder="Trois clients en janvier, douze en août. Le chiffre d’affaires a doublé après l’achat de la deuxième couveuse."
            />
          </Champ>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text2)]">
            <input
              type="checkbox"
              name="formalise"
              checked={Boolean(v.formalise)}
              onChange={(e) => setV((a) => ({ ...a, formalise: e.target.checked }))}
              className="h-4 w-4 accent-[var(--gold)]"
            />
            L&rsquo;entreprise est formalisée (RCCM, IFU ou équivalent)
          </label>
        </Section>

        <Section titre="Équipe" numero="04">
          <Champ label="Nombre de personnes dans l’équipe">
            <input
              name="equipe_taille"
              className="champ mono max-w-32"
              inputMode="numeric"
              value={String(v.equipe_taille)}
              onChange={set('equipe_taille')}
              placeholder="3"
            />
          </Champ>
          <Champ label="Qui fait quoi" aide="Et surtout : pourquoi ces personnes-là sont les bonnes.">
            <textarea
              name="equipe_description"
              className="champ"
              rows={4}
              value={String(v.equipe_description)}
              onChange={set('equipe_description')}
              maxLength={2000}
            />
          </Champ>
        </Section>

        <Section titre="Modèle économique" numero="05">
          <Champ label="Comment gagnez-vous de l’argent ?">
            <textarea
              name="modele"
              className="champ"
              rows={3}
              value={String(v.modele)}
              onChange={set('modele')}
              maxLength={1500}
            />
          </Champ>
          <Champ label="Qui fait déjà ça, et vous alors ?">
            <textarea
              name="concurrence"
              className="champ"
              rows={3}
              value={String(v.concurrence)}
              onChange={set('concurrence')}
              maxLength={1500}
            />
          </Champ>
        </Section>

        <Section titre="Demande de financement" numero="06">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Montant recherché (FCFA)">
              <input
                name="besoin_fcfa"
                className="champ mono"
                inputMode="numeric"
                value={String(v.besoin_fcfa)}
                onChange={set('besoin_fcfa')}
                placeholder="5000000"
              />
            </Champ>
            <Champ label="Contrepartie proposée">
              <select
                name="contrepartie"
                className="champ"
                value={String(v.contrepartie)}
                onChange={set('contrepartie')}
              >
                <option value="">Choisir…</option>
                {CONTREPARTIES.map((c) => (
                  <option key={c.valeur} value={c.valeur}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
          <Champ label="À quoi servira précisément cet argent ?" aide="Poste par poste, avec des montants.">
            <textarea
              name="usage_des_fonds"
              className="champ"
              rows={4}
              value={String(v.usage_des_fonds)}
              onChange={set('usage_des_fonds')}
              maxLength={2000}
            />
          </Champ>
        </Section>

        <Section titre="Contact" numero="07" note="Visible uniquement par les structures inscrites, jamais affiché publiquement.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom du contact">
              <input
                name="contact_nom"
                className="champ"
                value={String(v.contact_nom)}
                onChange={set('contact_nom')}
              />
            </Champ>
            <Champ label="Téléphone">
              <input
                name="contact_telephone"
                className="champ"
                value={String(v.contact_telephone)}
                onChange={set('contact_telephone')}
                placeholder="+226 70 00 00 00"
              />
            </Champ>
          </div>
          <Champ label="E-mail" obligatoire>
            <input
              name="contact_email"
              type="email"
              className="champ"
              value={String(v.contact_email)}
              onChange={set('contact_email')}
            />
          </Champ>
        </Section>

        {etatEnregistrement && <Message resultat={etatEnregistrement} />}

        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-[var(--border)] bg-[var(--bg)]/90 px-1 py-4 backdrop-blur-lg">
          <button type="submit" className="bouton bouton-or" disabled={enregistrementEnCours}>
            {enregistrementEnCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
            Enregistrer
          </button>
          <span className="mono text-xs text-[var(--text3)]">
            {total} / 100 · {publiable ? 'publiable' : `${Math.max(0, SCORE_PUBLICATION - total)} points avant publication`}
          </span>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <PanneauScore score={total} criteres={criteres} />

        {dossier && (
          <form action={actionPublier} className="carte p-6">
            <input type="hidden" name="id" value={dossier.id} />
            <p className="etiquette">Publication</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text2)]">
              Publier fige le contenu actuel, l&rsquo;horodate et l&rsquo;ajoute à votre historique.
              La publication précédente n&rsquo;est jamais effacée.
            </p>
            <button
              type="submit"
              className="bouton bouton-or mt-5 w-full"
              disabled={!publiable || publicationEnCours}
            >
              {publicationEnCours ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <Send size={15} aria-hidden />
              )}
              {dossier.publie ? 'Publier une mise à jour' : 'Publier mon dossier'}
            </button>
            {!publiable && (
              <p className="mt-3 text-xs leading-relaxed text-[var(--text3)]">
                Enregistrez d&rsquo;abord, puis atteignez {SCORE_PUBLICATION} points.
              </p>
            )}
            {etatPublication && (
              <div className="mt-4">
                <Message resultat={etatPublication} />
              </div>
            )}
          </form>
        )}
      </aside>
    </div>
  );
}

function Section({
  titre,
  numero,
  note,
  children,
}: {
  titre: string;
  numero: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="carte p-6 sm:p-7">
      <div className="flex items-baseline gap-3">
        <span className="mono text-xs text-[var(--gold3)]">{numero}</span>
        <h2 className="titre text-xl">{titre}</h2>
      </div>
      {note && <p className="mt-2.5 text-xs leading-relaxed text-[var(--text3)]">{note}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

/** Une étiquette posée à côté d'un champ n'est pas une étiquette : un lecteur
 *  d'écran annonce « zone de texte » et rien d'autre. On rattache donc le
 *  `<label>` au contrôle par un identifiant, et l'aide par `aria-describedby`
 *  — décrite après le nom du champ, pas à sa place. */
function Champ({
  label,
  aide,
  obligatoire,
  children,
}: {
  label: string;
  aide?: string;
  obligatoire?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const idAide = `${id}-aide`;
  const controle = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        ...(aide ? { 'aria-describedby': idAide } : {}),
      })
    : children;

  return (
    <div>
      <label htmlFor={id} className="etiquette mb-2 block">
        {label}
        {obligatoire && (
          <span className="ml-1 text-[var(--gold)]" aria-hidden>
            *
          </span>
        )}
      </label>
      {aide && (
        <p id={idAide} className="mb-2.5 -mt-1 text-xs leading-relaxed text-[var(--text3)]">
          {aide}
        </p>
      )}
      {controle}
    </div>
  );
}

function Message({ resultat }: { resultat: Resultat }) {
  const bon = resultat.ok;
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
      style={{
        background: bon ? 'rgb(34 217 138 / 0.1)' : 'rgb(239 68 68 / 0.1)',
        border: `1px solid ${bon ? 'rgb(34 217 138 / 0.3)' : 'rgb(239 68 68 / 0.3)'}`,
        color: bon ? 'var(--green)' : 'var(--red)',
      }}
    >
      {bon ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
      )}
      {resultat.message}
    </p>
  );
}
