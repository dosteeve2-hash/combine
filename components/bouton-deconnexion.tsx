'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

interface Props {
  /**
   * Classes du bouton. Le défaut est la forme pleine largeur qu'attend la page
   * « vérification requise », où le bouton est seul dans une carte.
   *
   * Ces classes étaient codées en dur. Dans la barre d'en-tête, `w-full py-3`
   * poussait la rangée à 414 px : **toutes les pages d'un compte connecté
   * débordaient de 39 px sur un écran de 375 px** — le filtre 3 de la doctrine,
   * un Android à 60 000 FCFA. Un composant ne décide pas de sa largeur à la
   * place du contexte qui l'accueille.
   */
  className?: string;
  /** Barre horizontale étroite : l'icône seule, avec son nom accessible. */
  iconeSeule?: boolean;
}

export function BoutonDeconnexion({
  className = 'bouton bouton-or w-full py-3',
  iconeSeule = false,
}: Props = {}) {
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

  const libelle = enCours ? 'Déconnexion…' : 'Me déconnecter';

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={deconnecter}
        disabled={enCours}
        // Sans texte visible, le bouton a besoin d'un nom pour un lecteur
        // d'écran — et d'une infobulle pour qui ne reconnaît pas l'icône.
        {...(iconeSeule ? { 'aria-label': libelle, title: libelle } : {})}
      >
        {iconeSeule ? (
          <>
            <LogOut size={16} aria-hidden />
            <span className="hidden sm:inline">{libelle}</span>
          </>
        ) : (
          libelle
        )}
      </button>
      {erreur && <p role="alert" className="text-sm text-[var(--red)]">{erreur}</p>}
    </>
  );
}
