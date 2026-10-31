import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';
import { baseConfiguree } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const nonConfiguree = () =>
  Response.json({ erreur: 'Base non configurée.' }, { status: 503 });

export function GET(requete: Request) {
  if (!baseConfiguree()) return nonConfiguree();
  return toNextJsHandler(getAuth()).GET(requete);
}

export function POST(requete: Request) {
  if (!baseConfiguree()) return nonConfiguree();
  return toNextJsHandler(getAuth()).POST(requete);
}