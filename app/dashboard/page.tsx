import { createServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/auth';
import { Users, UserCheck, DollarSign, FileText, TrendingUp, MapPin, UserCog, Clock, UserX, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) return null;

  const isMaster = session.role === 'master';
  const siteFilter = session.role === 'site_manager' ? session.siteId : undefined;
  const supabase = createServerClient();

  const empQ = supabase.from('employees').select('*', { count: 'exact', head: true });
  const activeQ = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const payQ = supabase.from('payroll').select('*', { count: 'exact', head: true });
  const repQ = supabase.from('reports').select('*', { count: 'exact', head: true });

  if (siteFilter) { empQ.eq('site_id', siteFilter); activeQ.eq('site_id', siteFilter); payQ.eq('site_id', siteFilter); repQ.eq('site_id', siteFilter); }

  const [empR, activeR, payR, repR] = await Promise.all([empQ, activeQ, payQ, repQ]);

  let totalSites = 0, totalManagers = 0;
  if (isMaster) {
    const [sR, mR] = await Promise.all([
      supabase.from('sites').select('*', { count: 'exact', head: true }),
      supabase.from('site_managers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    totalSites = sR.count ?? 0;
    totalManagers = mR.count ?? 0;
  }

  // Attendance stats for today
  const today = format(new Date(), 'yyyy-MM-dd');
  const presentQ = supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', today).eq('status', 'Present');
  const absentQ = supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', today).eq('status', 'Absent');
  const leaveQ = supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', today).in('status', ['Sick Leave', 'Annual Leave']);
  const totalAttQ = supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', today);

  if (siteFilter) { presentQ.eq('site_id', siteFilter); absentQ.eq('site_id', siteFilter); leaveQ.eq('site_id', siteFilter); totalAttQ.eq('site_id', siteFilter); }

  const [presentR, absentR, leaveR, totalAttR] = await Promise.all([presentQ, absentQ, leaveQ, totalAttQ]);

  const recentPayQ = supabase.from('payroll').select('*, employees(full_name, employee_number)').order('created_at', { ascending: false }).limit(5);
  const recentRepQ = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(5);
  if (siteFilter) { recentPayQ.eq('site_id', siteFilter); recentRepQ.eq('site_id', siteFilter); }
  const [{ data: recentPayroll }, { data: recentReports }] = await Promise.all([recentPayQ, recentRepQ]);

  const stats = [
    ...(isMaster ? [
      { label: 'Total Sites', value: totalSites, icon: MapPin, color: 'text-violet-400', bg: 'bg-violet-400/10', href: '/dashboard/sites' },
      { label: 'Site Managers', value: totalManagers, icon: UserCog, color: 'text-teal-400', bg: 'bg-teal-400/10', href: '/dashboard/managers' },
    ] : []),
    { label: 'Total Employees', value: empR.count ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/dashboard/employees' },
    { label: 'Active Employees', value: activeR.count ?? 0, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/dashboard/employees?status=active' },
    { label: 'Present Today', value: presentR.count ?? 0, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/dashboard/attendance' },
    { label: 'Absent Today', value: absentR.count ?? 0, icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10', href: '/dashboard/attendance' },
    { label: 'On Leave Today', value: leaveR.count ?? 0, icon: CalendarCheck, color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/dashboard/attendance' },
    { label: 'Payroll Records', value: payR.count ?? 0, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/dashboard/payroll' },
    { label: 'Reports', value: repR.count ?? 0, icon: FileText, color: 'text-rose-400', bg: 'bg-rose-400/10', href: '/dashboard/reports' },
  ];

  const roleLabel = isMaster ? 'Master (CEO)' : 'Site Manager';
  const roleBadge = isMaster ? 'bg-amber-400/10 text-amber-400' : 'bg-teal-400/10 text-teal-400';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${roleBadge}`}>{roleLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-slate-400">{label}</p><p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p></div>
              <div className={`${bg} p-2.5 rounded-lg`}><Icon className={`w-5 h-5 ${color}`} /></div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-600 group-hover:text-slate-400 transition-colors"><TrendingUp className="w-3 h-3" /><span>View all</span></div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800"><h2 className="text-sm font-semibold text-white">Recent Payroll</h2><Link href="/dashboard/payroll" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">View all</Link></div>
          <div className="divide-y divide-slate-800">
            {recentPayroll && recentPayroll.length > 0 ? recentPayroll.map((record: any) => (
              <div key={record.id} className="px-5 py-3.5 flex items-center justify-between">
                <div><p className="text-sm font-medium text-white">{record.employees?.full_name ?? 'Unknown'}</p><p className="text-xs text-slate-500">{record.employees?.employee_number} &bull; {record.pay_period}</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-emerald-400">&#8369;{Number(record.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p><p className="text-xs text-slate-500 capitalize">{record.employee_type}</p></div>
              </div>
            )) : <div className="px-5 py-8 text-center text-slate-500 text-sm">No payroll records yet</div>}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800"><h2 className="text-sm font-semibold text-white">Recent Reports</h2><Link href="/dashboard/reports" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">View all</Link></div>
          <div className="divide-y divide-slate-800">
            {recentReports && recentReports.length > 0 ? recentReports.map((report) => (
              <div key={report.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-slate-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{report.title}</p><p className="text-xs text-slate-500">{format(new Date(report.created_at), 'MMM d, yyyy')} &bull; {(report.file_size / 1024).toFixed(1)} KB</p></div>
              </div>
            )) : <div className="px-5 py-8 text-center text-slate-500 text-sm">No reports uploaded yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
