'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Handshake, Loader2 } from 'lucide-react';
import { marquerInteret, type Resultat } from '@/app/actions/dossier';

interface Props {
  dossierId: string;
  connecte: boolean;
  dejaInteresse: boolean;
  nomProjet: string;
}

export function FormulaireInteret({ dossierId, connecte, dejaInteresse, nomProjet }: Props) {
  const [etat, action, enCours] = useActionState<Resultat | null, FormData>(marquerInteret, null);

  if (!connecte) {
    return (
      <div className="carte p-6">
        <Handshake size={20} className="text-[var(--gold)]" aria-hidden />
        <p className="mt-4 font-medium">Vous financez des projets ?</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">
          Créez un compte pour marquer votre intérêt. Le porteur reçoit vos coordonnées et vous
          contacte directement — COMBINE ne s&rsquo;interpose pas.
        </p>
        <Link href="/inscription" className="bouton bouton-or mt-5 w-full">
          Créer un compte
        </Link>
      </div>
    );
  }

  if (dejaInteresse || etat?.ok) {
    return (
      <div className="carte p-6">
        <CheckCircle2 size={20} className="text-[var(--green)]" aria-hidden />
        <p className="mt-4 font-medium">Intérêt transmis</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">
          Le porteur de {nomProjet} a reçu vos coordonnées. La suite se passe entre vous.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="carte p-6">
      <input type="hidden" name="dossier_id" value={dossierId} />
      <Handshake size={20} className="text-[var(--gold)]" aria-hidden />
      <p className="mt-4 font-medium">Marquer mon intérêt</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">
        Aucun engagement, aucun montant. Le porteur reçoit simplement vos coordonnées.
      </p>
      <textarea
        name="message"
        className="champ mt-4"
        rows={3}
        maxLength={1000}
        placeholder="Un mot pour vous présenter (facultatif)"
      />
      <button type="submit" className="bouton bouton-or mt-4 w-full" disabled={enCours}>
        {enCours && <Loader2 size={15} className="animate-spin" aria-hidden />}
        Envoyer mon intérêt
      </button>
      {etat && !etat.ok && (
        <p role="alert" className="mt-3 text-sm text-[var(--red)]">
          {etat.message}
        </p>
      )}
    </form>
  );
}
