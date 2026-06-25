import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import Sidebar from '@/components/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await getServerSession();
  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
