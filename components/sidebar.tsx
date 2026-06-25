'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, Users, DollarSign, FileText, Settings, LogOut, Menu, X, ChevronRight, MapPin, UserCog, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type SessionInfo = { role: 'master' | 'site_manager'; username: string; siteId?: string };

const masterNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/sites', label: 'Sites', icon: MapPin },
  { href: '/dashboard/managers', label: 'Site Managers', icon: UserCog },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/attendance', label: 'Attendance', icon: Clock },
  { href: '/dashboard/payroll', label: 'Payroll', icon: DollarSign },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const managerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/attendance', label: 'Attendance', icon: Clock },
  { href: '/dashboard/payroll', label: 'Payroll', icon: DollarSign },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => setSession(d)).catch(() => {});
  }, []);

  const navItems = session?.role === 'master' ? masterNav : managerNav;
  const isMaster = session?.role === 'master';

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div><p className="text-sm font-bold text-white leading-tight">Hitcon</p><p className="text-xs text-slate-500 leading-tight">Construction</p></div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Main Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group', active ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}>
              <Icon className={cn('w-4 h-4 shrink-0 transition-colors', active ? 'text-amber-400' : 'text-slate-500 group-hover:text-white')} />
              <span>{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-amber-400" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="px-3 py-2 mb-3">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">Signed in as</p>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider', isMaster ? 'bg-amber-400/10 text-amber-400' : 'bg-teal-400/10 text-teal-400')}>{isMaster ? 'Master' : 'Manager'}</span>
          </div>
          <p className="text-sm font-medium text-white">{session?.username || '—'}</p>
        </div>
        <button onClick={handleLogout} disabled={loggingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50">
          <LogOut className="w-4 h-4 shrink-0" /><span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-30"><SidebarContent /></aside>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 h-14 flex items-center px-4 gap-4">
        <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white transition-colors"><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center"><Building2 className="w-4 h-4 text-white" strokeWidth={1.5} /></div><span className="text-sm font-bold text-white">Hitcon Construction</span></div>
      </header>
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="absolute top-3 right-3"><button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><X className="w-4 h-4" /></button></div>
        <SidebarContent />
      </aside>
    </>
  );
}
