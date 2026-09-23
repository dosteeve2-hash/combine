'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { signIn, signUp } from '@/lib/auth-client';

interface Props {
  mode: 'connexion' | 'inscription';
  verificationEmailConfiguree: boolean;
  inscriptionDisponible: boolean;
}

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Adresse e-mail ou mot de passe incorrect.',
  USER_ALREADY_EXISTS: 'Un compte existe déjà avec cette adresse. Connectez-vous.',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit faire au moins 8 caractères.',
  EMAIL_NOT_VERIFIED: 'Confirmez votre adresse e-mail avec le lien envoyé avant de vous connecter.',
};

export function FormulaireAuth({ mode, verificationEmailConfiguree, inscriptionDisponible }: Props) {
  const router = useRouter();
  const inscription = mode === 'inscription';

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setConfirmation(null);

    if (inscription && nom.trim().length < 2) {
      setErreur('Indiquez votre nom.');
      return;
    }
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }

    setEnCours(true);
    const resultat = inscription
      ? await signUp.email({ name: nom.trim(), email: email.trim().toLowerCase(), password: motDePasse })
      : await signIn.email({ email: email.trim().toLowerCase(), password: motDePasse });

    if (resultat.error) {
      const code = resultat.error.code ?? '';
      setErreur(messages[code] ?? resultat.error.message ?? 'Une erreur est survenue. Réessayez.');
      setEnCours(false);
      return;
    }

    if (inscription && verificationEmailConfiguree) {
      setConfirmation('Compte créé. Ouvrez le lien de confirmation envoyé à cette adresse e-mail.');
      setEnCours(false);
      return;
    }

    router.push('/tableau-de-bord');
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="space-y-5" noValidate>
      {inscription && (
        <div>
          <label htmlFor="nom" className="etiquette mb-2 block">
            Votre nom
          </label>
          <input
            id="nom"
            name="nom"
            className="champ"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            placeholder="Aminata Ouédraogo"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="etiquette mb-2 block">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="champ"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
        />
      </div>

      <div>
        <label htmlFor="mdp" className="etiquette mb-2 block">
          Mot de passe
        </label>
        <input
          id="mdp"
          name="motDePasse"
          type="password"
          className="champ"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          autoComplete={inscription ? 'new-password' : 'current-password'}
          placeholder={inscription ? '8 caractères minimum' : ''}
          minLength={8}
          required
        />
      </div>

      {erreur && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 px-3.5 py-3 text-sm text-[var(--red)]"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {erreur}
        </p>
      )}

      {confirmation && (
        <p role="status" className="rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/10 px-3.5 py-3 text-sm leading-relaxed text-[var(--green)]">
          {confirmation}
        </p>
      )}

      <button type="submit" className="bouton bouton-or w-full py-3" disabled={enCours}>
        {enCours && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {inscription ? 'Créer mon compte' : 'Se connecter'}
      </button>

      {(!inscription || inscriptionDisponible) && (
        <p className="text-center text-sm text-[var(--text2)]">
          {inscription ? 'Vous avez déjà un compte ? ' : 'Pas encore de compte ? '}
          <Link href={inscription ? '/connexion' : '/inscription'} className="lien-or">
            {inscription ? 'Se connecter' : 'Créer un compte'}
          </Link>
        </p>
      )}
    </form>
  );
}
