'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';
import { SCORE_PUBLICATION } from '@/lib/plans';
import { mentionScore, type Critere } from '@/lib/score';

export function AnneauScore({ score, taille = 116 }: { score: number; taille?: number }) {
  const mention = mentionScore(score);
  const rayon = taille / 2 - 7;
  const circonference = 2 * Math.PI * rayon;

  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90" aria-hidden>
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="var(--border2)"
          strokeWidth="6"
        />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={mention.couleur}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - Math.min(100, score) / 100)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-2xl font-medium" style={{ color: mention.couleur }}>
          {score}
        </span>
        <span className="mono text-[0.625rem] text-[var(--text3)]">/ 100</span>
      </div>
    </div>
  );
}

export function PanneauScore({ score, criteres }: { score: number; criteres: Critere[] }) {
  const mention = mentionScore(score);
  const publiable = score >= SCORE_PUBLICATION;

  return (
    <div className="carte p-6">
      <p className="etiquette">Préparation du dossier</p>

      <div className="mt-5 flex items-center gap-5">
        <AnneauScore score={score} />
        <div className="min-w-0">
          <p className="text-lg leading-snug font-medium" style={{ color: mention.couleur }}>
            {mention.libelle}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text2)]">
            {publiable
              ? 'Votre dossier peut être publié. Chaque point gagné le rend plus convaincant.'
              : `Il manque ${SCORE_PUBLICATION - score} points pour pouvoir publier.`}
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-5">
        {criteres.map((c) => {
          const complet = c.obtenus === c.points;
          return (
            <li key={c.cle}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {complet ? (
                    <CircleCheck size={14} className="shrink-0 text-[var(--green)]" aria-hidden />
                  ) : (
                    <CircleAlert size={14} className="shrink-0 text-[var(--text3)]" aria-hidden />
                  )}
                  <span className={complet ? 'text-[var(--text2)]' : 'text-[var(--text)]'}>
                    {c.libelle}
                  </span>
                </span>
                <span className="mono shrink-0 text-xs text-[var(--text3)]">
                  {c.obtenus}/{c.points}
                </span>
              </div>
              {c.manques.length > 0 && (
                <ul className="mt-1.5 ml-[22px] space-y-1">
                  {c.manques.map((m) => (
                    <li key={m} className="text-xs leading-relaxed text-[var(--text3)]">
                      · {m}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
