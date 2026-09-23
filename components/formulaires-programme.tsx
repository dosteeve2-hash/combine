'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react';
import {
  candidater,
  changerStatutAppel,
  creerAppel,
  creerOrganisation,
  deciderCandidature,
  evaluer,
} from '@/app/actions/programme';
import type { Resultat } from '@/app/actions/dossier';
import { PAYS, SECTEURS, TYPES_ORGANISATION } from '@/lib/brand';
import { CRITERES_EVALUATION } from '@/lib/types';

function Retour({ etat }: { etat: Resultat | null }) {
  if (!etat) return null;
  const bon = etat.ok;
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
      {etat.message}
    </p>
  );
}

export function FormulaireOrganisation() {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(creerOrganisation, null);

  return (
    <form action={action} className="carte space-y-5 p-7">
      <div>
        <label htmlFor="org-nom" className="etiquette mb-2 block">
          Nom de la structure
        </label>
        <input
          id="org-nom"
          name="nom"
          className="champ"
          placeholder="La Fabrique"
          maxLength={140}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="org-type" className="etiquette mb-2 block">
            Type
          </label>
          <select id="org-type" name="type" className="champ" defaultValue="incubateur">
            {TYPES_ORGANISATION.map((t) => (
              <option key={t.valeur} value={t.valeur}>
                {t.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="org-pays" className="etiquette mb-2 block">
            Pays
          </label>
          <select id="org-pays" name="pays" className="champ" defaultValue="Burkina Faso" required>
            {PAYS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Retour etat={etat} />

      <button type="submit" className="bouton bouton-or w-full py-3" disabled={enCours}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Créer ma structure
      </button>
      <p className="text-xs leading-relaxed text-[var(--text3)]">
        Vous démarrez sur le plan Essai : un appel à candidatures et dix dossiers. Aucune carte
        bancaire, aucun engagement.
      </p>
    </form>
  );
}

export function FormulaireAppel() {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(creerAppel, null);

  if (!ouvert) {
    return (
      <button type="button" className="bouton bouton-or" onClick={() => setOuvert(true)}>
        <Plus size={15} aria-hidden /> Nouvel appel
      </button>
    );
  }

  return (
    <form action={action} className="carte w-full space-y-5 p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="titre text-xl">Nouvel appel à candidatures</h2>
        <button type="button" className="bouton bouton-discret" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </div>

      <div>
        <label htmlFor="apl-titre" className="etiquette mb-2 block">
          Titre
        </label>
        <input
          id="apl-titre"
          name="titre"
          className="champ"
          placeholder="Cohorte agro-transformation 2027"
          maxLength={160}
          required
        />
      </div>

      <div>
        <label htmlFor="apl-desc" className="etiquette mb-2 block">
          Ce que vous cherchez
        </label>
        <textarea
          id="apl-desc"
          name="description"
          className="champ"
          rows={4}
          maxLength={4000}
          placeholder="Douze entreprises de transformation agroalimentaire au Burkina, avec au moins un client payant, accompagnées six mois."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="apl-score" className="etiquette mb-2 block">
            Score minimum exigé
          </label>
          <input
            id="apl-score"
            name="score_minimum"
            className="champ mono"
            inputMode="numeric"
            defaultValue={60}
          />
          <p className="mt-2 text-xs leading-relaxed text-[var(--text3)]">
            En dessous de 60, un dossier est rarement exploitable.
          </p>
        </div>
        <div>
          <label htmlFor="apl-date" className="etiquette mb-2 block">
            Date de clôture
          </label>
          <input id="apl-date" name="ferme_le" type="date" className="champ mono" />
        </div>
      </div>

      <fieldset>
        <legend className="etiquette mb-2.5">Secteurs visés (facultatif)</legend>
        <div className="flex flex-wrap gap-2">
          {SECTEURS.map((s) => (
            <label
              key={s}
              className="mono cursor-pointer rounded-lg border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)] transition-colors has-checked:border-[var(--gold3)] has-checked:text-[var(--gold)]"
            >
              <input type="checkbox" name="secteurs" value={s} className="sr-only" />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <Retour etat={etat} />

      <button type="submit" className="bouton bouton-or" disabled={enCours}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Ouvrir l&rsquo;appel
      </button>
    </form>
  );
}

export function BlocEvaluation({
  candidatureId,
  notes,
  commentaire,
}: {
  candidatureId: string;
  notes: Partial<Record<string, number | null>>;
  commentaire: string | null;
}) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(evaluer, null);

  return (
    <form action={action} className="space-y-4 border-t border-[var(--border)] pt-5">
      <input type="hidden" name="candidature_id" value={candidatureId} />
      <p className="etiquette">Mon évaluation</p>

      <div className="space-y-3">
        {CRITERES_EVALUATION.map((c) => (
          <div key={c.cle} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-[var(--text)]">{c.libelle}</p>
              <p className="text-xs leading-snug text-[var(--text3)]">{c.aide}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name={c.cle}
                    value={n}
                    defaultChecked={notes[c.cle] === n}
                    className="peer sr-only"
                  />
                  <span className="mono flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border2)] text-xs text-[var(--text3)] transition-colors peer-checked:border-[var(--gold)] peer-checked:bg-[var(--gold)] peer-checked:text-[var(--bg)]">
                    {n}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <textarea
        name="commentaire"
        className="champ"
        rows={3}
        maxLength={3000}
        defaultValue={commentaire ?? ''}
        placeholder="Ce qui vous a convaincu, ce qui vous inquiète."
      />

      <Retour etat={etat} />

      <button type="submit" className="bouton bouton-contour" disabled={enCours}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Enregistrer mon évaluation
      </button>
    </form>
  );
}

export function BoutonCandidater({ appelId, deja }: { appelId: string; deja: boolean }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(candidater, null);

  if (deja || etat?.ok) {
    return (
      <span className="mono inline-flex items-center gap-1.5 text-xs text-[var(--green)]">
        <CheckCircle2 size={13} aria-hidden /> Candidature déposée
      </span>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="appel_id" value={appelId} />
      <button type="submit" className="bouton bouton-contour" disabled={enCours}>
        {enCours && <Loader2 size={14} className="animate-spin" aria-hidden />}
        Candidater
      </button>
      {etat && !etat.ok && (
        <span role="alert" className="max-w-52 text-right text-xs text-[var(--red)]">
          {etat.message}
        </span>
      )}
    </form>
  );
}

export function BoutonFermerAppel({ appelId }: { appelId: string }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    changerStatutAppel,
    null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={appelId} />
      <input type="hidden" name="statut" value="ferme" />
      <button type="submit" className="bouton bouton-discret w-full" disabled={enCours}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Fermer l&rsquo;appel
      </button>
      {etat && !etat.ok && (
        <span role="alert" className="mt-2 block text-xs text-[var(--red)]">
          {etat.message}
        </span>
      )}
    </form>
  );
}

export function BoutonsDecision({ candidatureId, statut }: { candidatureId: string; statut: string }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    deciderCandidature,
    null,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={candidatureId} />
      <button
        type="submit"
        name="statut"
        value="retenue"
        className="bouton bouton-contour"
        disabled={enCours || statut === 'retenue'}
        style={statut === 'retenue' ? { borderColor: 'var(--green)', color: 'var(--green)' } : undefined}
      >
        Retenir
      </button>
      <button
        type="submit"
        name="statut"
        value="ecartee"
        className="bouton bouton-discret"
        disabled={enCours || statut === 'ecartee'}
      >
        Écarter
      </button>
      {etat && !etat.ok && (
        <span role="alert" className="text-xs text-[var(--red)]">
          {etat.message}
        </span>
      )}
    </form>
  );
}
