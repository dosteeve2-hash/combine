import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Link2, Plug } from 'lucide-react';
import { sql } from '@/lib/db';
import { exigerUtilisateur } from '@/lib/session';
import { libelleSource, type ChargePasserelle } from '@/lib/passerelle';
import {
  BoutonAppliquerImport,
  BoutonRevoquerJeton,
  FormulaireJeton,
} from '@/components/formulaires-passerelle';

export const metadata: Metadata = {
  title: 'Passerelle FORGE',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function Passerelle() {
  const utilisateur = await exigerUtilisateur();

  const dossiers = (await sql`
    select id from dossier where user_id = ${utilisateur.id} order by cree_le asc limit 1
  `) as { id: string }[];
  const dossier = dossiers[0] ?? null;

  const jetons = dossier
    ? ((await sql`
        select id, source, revoque, dernier_usage_le::text, cree_le::text
          from jeton_passerelle where dossier_id = ${dossier.id} order by cree_le desc
      `) as {
        id: string;
        source: string;
        revoque: boolean;
        dernier_usage_le: string | null;
        cree_le: string;
      }[])
    : [];

  const imports = dossier
    ? ((await sql`
        select id, source, charge, applique, cree_le::text
          from import_passerelle where dossier_id = ${dossier.id}
         order by cree_le desc limit 20
      `) as {
        id: string;
        source: string;
        charge: ChargePasserelle;
        applique: boolean;
        cree_le: string;
      }[])
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12">
      <Link
        href="/tableau-de-bord"
        className="mono inline-flex items-center gap-1.5 text-xs text-[var(--text3)] hover:text-[var(--gold)]"
      >
        <ArrowLeft size={13} aria-hidden /> Mon espace
      </Link>

      <header className="mt-6 mb-10">
        <p className="etiquette">Passerelle FORGE</p>
        <h1 className="titre mt-3 text-3xl sm:text-4xl">
          Vos chiffres sont déjà quelque part. Ne les retapez pas.
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-[var(--text2)]">
          Si vous tenez votre exploitation dans AgroTrack, LivestockOS, CompTrack ou un autre
          logiciel FORGE, générez un jeton, collez-le là-bas, et vos chiffres réels arrivent ici —
          datés, issus de votre activité, pas d&rsquo;un tableur rempli la veille du rendez-vous.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text3)]">
          Rien n&rsquo;est appliqué automatiquement : chaque envoi vous est présenté, et c&rsquo;est
          vous qui décidez de le reprendre.
        </p>
      </header>

      {!dossier ? (
        <div className="carte flex flex-col items-center px-6 py-16 text-center">
          <Plug size={28} className="text-[var(--text3)]" aria-hidden />
          <p className="mt-5 text-lg font-medium">Créez d&rsquo;abord votre dossier</p>
          <Link href="/tableau-de-bord/dossier" className="bouton bouton-or mt-6">
            Monter mon dossier
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          <section className="carte p-7">
            <p className="etiquette">Générer un jeton</p>
            <div className="mt-5">
              <FormulaireJeton />
            </div>
          </section>

          {jetons.length > 0 && (
            <section>
              <h2 className="etiquette">Mes jetons</h2>
              <ul className="carte mt-4 divide-y divide-[var(--border)]">
                {jetons.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Link2 size={14} className="text-[var(--gold3)]" aria-hidden />
                        {libelleSource(j.source)}
                        {j.revoque && (
                          <span className="mono rounded-md bg-[var(--red)]/10 px-2 py-0.5 text-[0.625rem] text-[var(--red)] uppercase">
                            révoqué
                          </span>
                        )}
                      </p>
                      <p className="mono mt-1 text-xs text-[var(--text3)]">
                        créé le {new Date(j.cree_le).toLocaleDateString('fr-FR')}
                        {j.dernier_usage_le
                          ? ` · dernier envoi le ${new Date(j.dernier_usage_le).toLocaleDateString('fr-FR')}`
                          : ' · jamais utilisé'}
                      </p>
                    </div>
                    {!j.revoque && <BoutonRevoquerJeton id={j.id} />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="etiquette">Ce qui est arrivé</h2>
            {imports.length === 0 ? (
              <p className="carte mt-4 px-6 py-10 text-center text-sm leading-relaxed text-[var(--text2)]">
                Rien pour l&rsquo;instant. Une fois le jeton collé dans l&rsquo;autre application,
                ses envois apparaîtront ici.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {imports.map((i) => (
                  <li key={i.id} className="carte p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{libelleSource(i.source)}</p>
                        <p className="mono mt-1 text-xs text-[var(--text3)]">
                          reçu le {new Date(i.cree_le).toLocaleDateString('fr-FR')}
                          {i.charge.constate_le && ` · constaté le ${i.charge.constate_le}`}
                        </p>
                      </div>
                      {i.applique ? (
                        <span className="mono text-xs text-[var(--green)]">déjà repris</span>
                      ) : (
                        <BoutonAppliquerImport id={i.id} />
                      )}
                    </div>

                    <dl className="mono mt-4 flex flex-wrap gap-5 border-t border-[var(--border)] pt-4 text-xs">
                      {i.charge.ca_mensuel_fcfa !== undefined && (
                        <div>
                          <dt className="text-[var(--text3)]">CA mensuel</dt>
                          <dd className="mt-0.5 text-[var(--gold)]">
                            {Number(i.charge.ca_mensuel_fcfa).toLocaleString('fr-FR')} FCFA
                          </dd>
                        </div>
                      )}
                      {i.charge.clients_actifs !== undefined && (
                        <div>
                          <dt className="text-[var(--text3)]">Clients actifs</dt>
                          <dd className="mt-0.5 text-[var(--gold)]">{i.charge.clients_actifs}</dd>
                        </div>
                      )}
                      {i.charge.employes !== undefined && (
                        <div>
                          <dt className="text-[var(--text3)]">Employés</dt>
                          <dd className="mt-0.5 text-[var(--gold)]">{i.charge.employes}</dd>
                        </div>
                      )}
                    </dl>

                    {i.charge.commentaire && (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--text2)]">
                        {i.charge.commentaire}
                      </p>
                    )}
                    {i.charge.lien_verification && (
                      <p className="mono mt-3 truncate text-xs text-[var(--text3)]">
                        vérifiable : {i.charge.lien_verification}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="carte p-7">
            <p className="etiquette">Pour brancher une application</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text2)]">
              Le contrat est le même pour tout l&rsquo;écosystème. L&rsquo;application envoie :
            </p>
            <pre className="mono mt-4 overflow-x-auto rounded-xl bg-[var(--bg)] p-4 text-xs leading-relaxed text-[var(--text2)]">
{`POST /api/passerelle
Authorization: Bearer <votre jeton>
Content-Type: application/json

{
  "source": "livestockos",
  "constate_le": "2026-09-22",
  "ca_mensuel_fcfa": 450000,
  "clients_actifs": 12,
  "employes": 4,
  "lien_verification": "https://…/verifier/K7M2-P9XQ"
}`}
            </pre>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text3)]">
              Réponse 202 : l&rsquo;envoi est accepté et attend votre validation. Tous les champs
              sont facultatifs sauf <code className="mono">source</code>.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
