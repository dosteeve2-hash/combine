'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

export function BoutonDeconnexion() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function deconnecter() {
    setEnCours(true);
    const resultat = await signOut();
    if (resultat.error) {
      setErreur('La déconnexion a échoué. Réessayez.');
      setEnCours(false);
      return;
    }
    router.replace('/connexion');
    router.refresh();
  }

  return (
    <>
      <button type="button" className="bouton bouton-or w-full py-3" onClick={deconnecter} disabled={enCours}>
        {enCours ? 'Déconnexion…' : 'Me déconnecter'}
      </button>
      {erreur && <p role="alert" className="text-sm text-[var(--red)]">{erreur}</p>}
    </>
  );
}
