import { Entete } from '@/components/entete';
import { Pied } from '@/components/pied';

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Entete />
      <main className="flex-1">{children}</main>
      <Pied />
    </>
  );
}
