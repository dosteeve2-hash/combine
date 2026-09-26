import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';
import { sql } from '@/lib/db';
import { sessionActuelle } from '@/lib/session';
import { ROLES_MEMBRE } from '@/lib/portefeuille';
import { FormulaireAcceptation } from '@/components/formulaire-invitation-acceptation';
import { BoutonVerificationEmail } from '@/components/bouton-verification-email';
import { verificationEmailConfiguree } from '@/lib/email-config';

export const metadata: Metadata = {
  title: 'Invitation',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function Invitation({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const lignes = (await sql`
    select i.email, i.role, i.acceptee_le, i.expire_le, o.nom as organisation, o.pays, o.type
      from invitation i join organisation o on o.id = i.organisation_id
     where i.code = ${code}
  `) as {
    email: string;
    role: string;
    acceptee_le: string | null;
    expire_le: string;
    organisation: string;
    pays: string;
    type: string;
  }[];
  const invitation = lignes[0];
  if (!invitation) notFound();

  const session = await sessionActuelle();
  const expiree = new Date(invitation.expire_le) < new Date();
  const role = ROLES_MEMBRE.find((r) => r.valeur === invitation.role);

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-20">
      <p className="etiquette">Invitation privée</p>
      <h1 className="titre mt-3 text-3xl">{invitation.organisation}</h1>
      <p className="mono mt-2 text-xs text-[var(--text3)]">
        {invitation.pays} · {invitation.type}
      </p>

      <p className="mt-7 leading-relaxed text-[var(--text2)]">
        Vous êtes invité à rejoindre cette structure en tant que{' '}
        <span className="text-[var(--gold)]">{role?.libelle ?? invitation.role}</span>.
      </p>
      {role && (
        <p className="mt-2.5 text-sm leading-relaxed text-[var(--text3)]">{role.aide}</p>
      )}

      <div className="carte mt-8 p-6">
        {invitation.acceptee_le ? (
          <p className="text-sm text-[var(--text2)]">
            Cette invitation a déjà été utilisée. Si c&rsquo;était vous,{' '}
            <Link href="/portefeuille" className="lien-or">
              ouvrez le portefeuille
            </Link>
            .
          </p>
        ) : expiree ? (
          <p className="text-sm text-[var(--text2)]">
            Cette invitation a expiré. Demandez-en une nouvelle à la personne qui vous l&rsquo;a
            envoyée.
          </p>
        ) : !session?.user ? (
          <>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-[var(--text2)]">
              <Lock size={15} className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden />
              Cette invitation a été émise pour{' '}
              <span className="mono text-[var(--text)]">{invitation.email}</span>. Connectez-vous
              avec cette adresse, ou créez le compte correspondant.
            </p>
            <div className="mt-5 flex gap-2">
              <Link href="/connexion" className="bouton bouton-or flex-1">
                Se connecter
              </Link>
              <Link href="/inscription" className="bouton bouton-contour flex-1">
                Créer le compte
              </Link>
            </div>
          </>
        ) : session.user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
          <p className="text-sm leading-relaxed text-[var(--text2)]">
            Vous êtes connecté en tant que{' '}
            <span className="mono text-[var(--text)]">{session.user.email}</span>, mais cette
            invitation a été émise pour{' '}
            <span className="mono text-[var(--text)]">{invitation.email}</span>. Déconnectez-vous et
            reconnectez-vous avec la bonne adresse.
          </p>
        ) : session.user.emailVerified !== true ? (
          <>
            <p className="text-sm leading-relaxed text-[var(--text2)]">
              Confirmez d&rsquo;abord la maîtrise de cette adresse e-mail pour rejoindre la structure.
            </p>
            {verificationEmailConfiguree ? (
              <BoutonVerificationEmail email={session.user.email} callbackURL={`/invitation/${code}`} />
            ) : (
              <p role="note" className="mt-3 text-sm leading-relaxed text-[var(--gold2)]">
                L&rsquo;envoi des confirmations e-mail n&rsquo;est pas encore configuré sur cette
                instance. Contactez la personne qui vous a invité.
              </p>
            )}
          </>
        ) : (
          <FormulaireAcceptation code={code} />
        )}
      </div>

      <p className="mt-8 flex gap-3 text-xs leading-relaxed text-[var(--text3)]">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[var(--green)]" aria-hidden />
        Cette page n&rsquo;est pas indexée et le lien ne fonctionne que pour l&rsquo;adresse
        invitée. COMBINE ne propose aucun placement au public : ce qui se décide ensuite se décide
        entre vous et cette structure, hors de la plateforme.
      </p>
    </div>
  );
}
