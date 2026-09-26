'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Copy, KeyRound, Loader2 } from 'lucide-react';
import { appliquerImport, creerJeton, revoquerJeton } from '@/app/actions/passerelle';
import type { ResultatJeton } from '@/app/actions/passerelle';
import type { Resultat } from '@/app/actions/dossier';
import { SOURCES } from '@/lib/passerelle';

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

export function FormulaireJeton() {
  const [etat, action, enCours] = useActionState<ResultatJeton | null, FormData>(creerJeton, null);
  const [copie, setCopie] = useState(false);

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap gap-2">
        <select
          name="source"
          aria-label="Application FORGE à relier"
          className="champ min-w-52 flex-1"
          defaultValue=""
          required
        >
          <option value="">Quelle application ?</option>
          {SOURCES.map((s) => (
            <option key={s.valeur} value={s.valeur}>
              {s.libelle}
            </option>
          ))}
        </select>
        <button type="submit" className="bouton bouton-or" disabled={enCours}>
          {enCours ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <KeyRound size={15} aria-hidden />
          )}
          Générer un jeton
        </button>
      </form>

      {etat && !etat.ok && <Retour etat={etat} />}

      {etat?.ok && etat.jeton && (
        <div className="rounded-xl border border-[var(--gold3)] bg-[var(--gold)]/5 p-5">
          <p className="etiquette mb-3 text-[var(--gold)]">
            Copiez-le maintenant — il ne sera plus jamais affiché
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="mono min-w-0 flex-1 overflow-x-auto rounded-lg bg-[var(--bg)] px-3 py-2.5 text-xs text-[var(--gold2)]">
              {etat.jeton}
            </code>
            <button
              type="button"
              className="bouton bouton-contour"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(etat.jeton ?? '');
                  setCopie(true);
                } catch {
                  /* presse-papiers indisponible : le jeton reste sélectionnable à la main */
                }
              }}
            >
              {copie ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {copie ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--text3)]">
            Seule son empreinte est conservée ici. Si vous le perdez, révoquez-le et générez-en un
            autre.
          </p>
        </div>
      )}
    </div>
  );
}

export function BoutonRevoquerJeton({ id }: { id: string }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(revoquerJeton, null);

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

export function BoutonAppliquerImport({ id }: { id: string }) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(appliquerImport, null);

  if (etat?.ok) {
    return (
      <span className="mono inline-flex items-center gap-1.5 text-xs text-[var(--green)]">
        <CheckCircle2 size={13} aria-hidden /> Repris dans le dossier
      </span>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="bouton bouton-contour" disabled={enCours}>
        {enCours && <Loader2 size={14} className="animate-spin" aria-hidden />}
        Reprendre dans mon dossier
      </button>
      {etat && !etat.ok && (
        <span role="alert" className="text-xs text-[var(--red)]">
          {etat.message}
        </span>
      )}
    </form>
  );
}
