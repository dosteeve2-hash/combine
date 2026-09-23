'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus, TrendingUp, UserPlus, X } from 'lucide-react';
import {
  ajouterValorisation,
  changerStatutParticipation,
  enregistrerParticipation,
  inviter,
  revoquerInvitation,
} from '@/app/actions/portefeuille';
import type { Resultat } from '@/app/actions/dossier';
import { INSTRUMENTS, ROLES_MEMBRE, STATUTS_PARTICIPATION } from '@/lib/portefeuille';

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

export function FormulaireParticipation({
  candidats,
}: {
  candidats: { id: string; nom: string; pays: string }[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    enregistrerParticipation,
    null,
  );

  if (!ouvert) {
    return (
      <button type="button" className="bouton bouton-or" onClick={() => setOuvert(true)}>
        <Plus size={15} aria-hidden /> Nouvelle participation
      </button>
    );
  }

  return (
    <form action={action} className="carte w-full space-y-5 p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="titre text-xl">Nouvelle participation</h2>
        <button type="button" className="bouton bouton-discret" onClick={() => setOuvert(false)}>
          <X size={15} aria-hidden />
        </button>
      </div>

      <div>
        <label htmlFor="par-dossier" className="etiquette mb-2 block">
          Entreprise
        </label>
        {candidats.length === 0 ? (
          <p className="rounded-xl border border-[var(--border2)] px-3.5 py-3 text-sm text-[var(--text2)]">
            Aucune entreprise éligible. Une participation ne se prend que dans une entreprise dont le
            dossier est publié — c&rsquo;est ce qui date et fige ce sur quoi vous avez investi.
          </p>
        ) : (
          <select id="par-dossier" name="dossier_id" className="champ" required>
            <option value="">Choisir…</option>
            {candidats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} — {c.pays}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="par-instrument" className="etiquette mb-2 block">
            Instrument
          </label>
          <select id="par-instrument" name="instrument" className="champ" defaultValue="equity">
            {INSTRUMENTS.map((i) => (
              <option key={i.valeur} value={i.valeur}>
                {i.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="par-montant" className="etiquette mb-2 block">
            Montant engagé (FCFA)
          </label>
          <input
            id="par-montant"
            name="montant_fcfa"
            className="champ mono"
            inputMode="numeric"
            placeholder="2000000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="par-pct" className="etiquette mb-2 block">
            Part obtenue (%)
          </label>
          <input id="par-pct" name="pourcentage" className="champ mono" inputMode="decimal" placeholder="12,5" />
        </div>
        <div>
          <label htmlFor="par-valo" className="etiquette mb-2 block">
            Valorisation d&rsquo;entrée
          </label>
          <input
            id="par-valo"
            name="valorisation_entree_fcfa"
            className="champ mono"
            inputMode="numeric"
            placeholder="16000000"
          />
        </div>
        <div>
          <label htmlFor="par-date" className="etiquette mb-2 block">
            Date d&rsquo;entrée
          </label>
          <input id="par-date" name="date_entree" type="date" className="champ mono" />
        </div>
      </div>

      <div>
        <label htmlFor="par-notes" className="etiquette mb-2 block">
          Notes internes
        </label>
        <textarea
          id="par-notes"
          name="notes"
          className="champ"
          rows={3}
          maxLength={3000}
          placeholder="Conditions, pacte, jalons convenus."
        />
      </div>

      <Retour etat={etat} />

      <button type="submit" className="bouton bouton-or" disabled={enCours || candidats.length === 0}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Enregistrer la participation
      </button>
    </form>
  );
}

export function FormulaireValorisation({ participationId }: { participationId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    ajouterValorisation,
    null,
  );

  if (!ouvert) {
    return (
      <button type="button" className="bouton bouton-contour" onClick={() => setOuvert(true)}>
        <TrendingUp size={14} aria-hidden /> Valoriser
      </button>
    );
  }

  return (
    <form action={action} className="mt-5 space-y-4 border-t border-[var(--border)] pt-5">
      <input type="hidden" name="participation_id" value={participationId} />
      <p className="etiquette">Nouvelle valorisation — elle s&rsquo;ajoute, elle n&rsquo;écrase pas</p>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs text-[var(--text3)]">Valeur (FCFA)</label>
          <input name="valeur_fcfa" className="champ mono" inputMode="numeric" required />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--text3)]">CA mensuel</label>
          <input name="ca_mensuel_fcfa" className="champ mono" inputMode="numeric" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--text3)]">Employés</label>
          <input name="employes" className="champ mono" inputMode="numeric" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--text3)]">Constatée le</label>
          <input name="constatee_le" type="date" className="champ mono" />
        </div>
      </div>

      <textarea
        name="commentaire"
        className="champ"
        rows={2}
        maxLength={2000}
        placeholder="Sur quoi repose cette valeur ?"
      />

      <Retour etat={etat} />

      <div className="flex gap-2">
        <button type="submit" className="bouton bouton-or" disabled={enCours}>
          {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
          Enregistrer
        </button>
        <button type="button" className="bouton bouton-discret" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export function BoutonsStatutParticipation({ id, statut }: { id: string; statut: string }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    changerStatutParticipation,
    null,
  );

  return (
    <form action={action} className="flex flex-wrap gap-1.5">
      <input type="hidden" name="id" value={id} />
      {STATUTS_PARTICIPATION.map((s) => (
        <button
          key={s.valeur}
          type="submit"
          name="statut"
          value={s.valeur}
          disabled={enCours || statut === s.valeur}
          className="mono rounded-lg border px-2.5 py-1 text-[0.6875rem] transition-colors disabled:opacity-100"
          style={
            statut === s.valeur
              ? { borderColor: s.couleur, color: s.couleur, background: `${s.couleur}14` }
              : { borderColor: 'var(--border2)', color: 'var(--text3)' }
          }
        >
          {s.libelle}
        </button>
      ))}
      {etat && !etat.ok && (
        <span role="alert" className="text-xs text-[var(--red)]">
          {etat.message}
        </span>
      )}
    </form>
  );
}

export function FormulaireInvitation() {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(inviter, null);
  const lien = etat?.ok && etat.dossierId ? `/invitation/${etat.dossierId}` : null;

  return (
    <form action={action} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          name="email"
          type="email"
          aria-label="Adresse e-mail de la personne invitée"
          className="champ min-w-48 flex-1"
          placeholder="adresse@exemple.com"
          required
        />
        <select
          name="role"
          aria-label="Rôle de la personne invitée"
          className="champ w-auto"
          defaultValue="investisseur"
        >
          {ROLES_MEMBRE.map((r) => (
            <option key={r.valeur} value={r.valeur}>
              {r.libelle}
            </option>
          ))}
        </select>
        <button type="submit" className="bouton bouton-contour" disabled={enCours}>
          {enCours ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <UserPlus size={15} aria-hidden />
          )}
          Inviter
        </button>
      </div>

      <Retour etat={etat} />

      {lien && (
        <div className="rounded-xl border border-[var(--border2)] bg-[var(--bg)] p-4">
          <p className="etiquette mb-2">Lien d&rsquo;invitation — à transmettre en privé</p>
          <code className="mono block overflow-x-auto text-xs text-[var(--gold)]">{lien}</code>
          <p className="mt-3 text-xs leading-relaxed text-[var(--text3)]">
            Envoyez-le par message ou e-mail à la personne concernée. Il ne fonctionne que pour
            l&rsquo;adresse invitée, et expire dans 30 jours. Ne le publiez nulle part : un accès
            investisseur proposé publiquement ferait basculer l&rsquo;opération dans l&rsquo;appel
            public à l&rsquo;épargne.
          </p>
        </div>
      )}
    </form>
  );
}

export function BoutonRevoquer({ id }: { id: string }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    revoquerInvitation,
    null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="bouton bouton-discret text-xs" disabled={enCours}>
        {enCours ? <Loader2 size={13} className="animate-spin" aria-hidden /> : 'Révoquer'}
      </button>
      {etat && !etat.ok && (
        <span role="alert" className="text-xs text-[var(--red)]">
          {etat.message}
        </span>
      )}
    </form>
  );
}
