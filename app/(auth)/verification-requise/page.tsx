import type { Metadata } from 'next';
import Link from 'next/link';
import { BoutonDeconnexion } from '@/components/bouton-deconnexion';

export const metadata: Metadata = { title: 'Vérifiez votre adresse e-mail' };

export default function VerificationRequise() {
  return (
    <>
      <h1 className="titre text-3xl">Vérifiez votre adresse.</h1>
      <p className="mt-2.5 mb-8 text-sm leading-relaxed text-[var(--text2)]">
        En production, une adresse vérifiée est nécessaire pour accéder à votre espace. Déconnectez-vous,
        puis reconnectez-vous pour recevoir un nouveau lien de vérification.
      </p>
      <div className="flex flex-col gap-3">
        <BoutonDeconnexion />
        <Link href="/connexion" className="bouton bouton-discret w-full py-3 text-center">
          Revenir à la connexion
        </Link>
      </div>
    </>
  );
}
