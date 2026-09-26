'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { sendVerificationEmail } from '@/lib/auth-client';

interface Props {
  email: string;
  callbackURL: string;
}

export function BoutonVerificationEmail({ email, callbackURL }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function renvoyer() {
    setMessage(null);
    setErreur(null);
    setEnCours(true);

    const resultat = await sendVerificationEmail({ email, callbackURL });
    if (resultat.error) {
      setErreur(resultat.error.message ?? 'Impossible d’envoyer le lien. Réessayez.');
    } else {
      setMessage('Un nouveau lien de confirmation vient d’être envoyé.');
    }
    setEnCours(false);
  }

  return (
    <div className="mt-4 space-y-3">
      <button type="button" className="bouton bouton-or" onClick={renvoyer} disabled={enCours}>
        {enCours ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <MailCheck size={15} aria-hidden />}
        Renvoyer le lien de confirmation
      </button>
      {message && (
        <p role="status" className="flex items-start gap-2 text-sm text-[var(--green)]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden />
          {message}
        </p>
      )}
      {erreur && (
        <p role="alert" className="flex items-start gap-2 text-sm text-[var(--red)]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {erreur}
        </p>
      )}
    </div>
  );
}
