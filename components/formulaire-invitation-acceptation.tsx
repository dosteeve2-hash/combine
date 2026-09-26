'use client';

import { useActionState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { accepterInvitation } from '@/app/actions/portefeuille';
import type { Resultat } from '@/app/actions/dossier';

export function FormulaireAcceptation({ code }: { code: string }) {
  // En cas de succès, l'action redirige elle-même vers le portefeuille : seul un refus
  // revient jusqu'ici.
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(
    accepterInvitation,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />

      {etat && !etat.ok && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 px-3.5 py-3 text-sm text-[var(--red)]"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {etat.message}
        </p>
      )}

      <button type="submit" className="bouton bouton-or w-full py-3" disabled={enCours}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Accepter l&rsquo;invitation
      </button>
    </form>
  );
}
