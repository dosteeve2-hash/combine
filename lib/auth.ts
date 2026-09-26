import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { Pool as PoolNeon, neonConfig } from '@neondatabase/serverless';
import { Pool as PoolPg } from 'pg';
import { after } from 'next/server';
import { postgresOrdinaire } from './db';
import { inscriptionDisponible, verificationEmailConfiguree, verificationEmailRequise } from './email-config';
import { envoyerLienVerification } from './email';

// Le pilote Neon parle Postgres au-dessus d'un WebSocket (443) plutôt qu'en TCP brut (5432) :
// c'est ce qui convient au serverless, où l'on n'entretient pas de pool. Sur un Postgres
// ordinaire — en local, ou chez un autre hébergeur — on repasse sur `pg`.
if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

const base = postgresOrdinaire()
  ? new PoolPg({ connectionString: process.env.DATABASE_URL, max: 5 })
  : new PoolNeon({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: base,
  emailAndPassword: {
    enabled: true,
    disableSignUp: !inscriptionDisponible,
    minPasswordLength: 8,
    autoSignIn: !verificationEmailRequise,
    requireEmailVerification: verificationEmailRequise,
  },
  ...(verificationEmailConfiguree
    ? {
        emailVerification: {
          sendOnSignUp: true,
          sendOnSignIn: true,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
            after(() => envoyerLienVerification(user, url));
          },
        },
      }
    : {}),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'porteur',
        input: true,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
