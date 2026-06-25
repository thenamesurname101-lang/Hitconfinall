import { createServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Phone, Hash, Briefcase, Building2,
  Clock, Calendar, DollarSign, Edit2, MapPin
} from 'lucide-react';
import { format } from 'date-fns';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const { id } = await params;
  const supabase = createServerClient();

  let empQuery = supabase.from('employees').select('*').eq('id', id);
  if (session.role === 'site_manager') empQuery = empQuery.eq('site_id', session.siteId || '');
  const { data: employee } = await empQuery.maybeSingle();

  if (!employee) notFound();

  let payrollQuery = supabase.from('payroll').select('*').eq('employee_id', id).order('created_at', { ascending: false }).limit(10);
  if (session.role === 'site_manager') payrollQuery = payrollQuery.eq('site_id', session.siteId || '');
  const { data: payrollHistory } = await payrollQuery;

  let attendanceQuery = supabase.from('attendance').select('*').eq('employee_id', id).order('attendance_date', { ascending: false }).limit(20);
  if (session.role === 'site_manager') attendanceQuery = attendanceQuery.eq('site_id', session.siteId || '');
  const { data: attendanceHistory } = await attendanceQuery;

  const isMaster = session.role === 'master';
  let siteName: string | null = null;
  if (isMaster && employee.site_id) {
    const { data: site } = await supabase.from('sites').select('project_name').eq('id', employee.site_id).maybeSingle();
    siteName = site?.project_name || null;
  }

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-400/10 text-emerald-400',
    inactive: 'bg-amber-400/10 text-amber-400',
    terminated: 'bg-red-400/10 text-red-400',
  };

  const typeColor: Record<string, string> = {
    monthly: 'bg-blue-400/10 text-blue-400',
    weekly: 'bg-teal-400/10 text-teal-400',
    daily: 'bg-orange-400/10 text-orange-400',
  };

  const attStatusColor: Record<string, string> = {
    Present: 'bg-emerald-400/10 text-emerald-400',
    Absent: 'bg-red-400/10 text-red-400',
    'Sick Leave': 'bg-amber-400/10 text-amber-400',
    'Annual Leave': 'bg-blue-400/10 text-blue-400',
    'Half Day': 'bg-orange-400/10 text-orange-400',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/employees"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-amber-400">
            {employee.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{employee.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-400 text-sm">{employee.employee_number}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[employee.status]}`}
              >
                {employee.status}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColor[employee.employment_type]}`}
              >
                {employee.employment_type}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/employees?edit=${employee.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </Link>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Personal Information</h2>
          <div className="space-y-3">
            <InfoRow icon={User} label="Full Name" value={employee.full_name} />
            <InfoRow icon={Hash} label="National ID" value={employee.national_id} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone_number || 'N/A'} />
            <InfoRow icon={Calendar} label="Date Hired" value={employee.date_hired ? format(new Date(employee.date_hired), 'MMMM d, yyyy') : 'N/A'} />
          </div>
        </div>

        {/* Employment Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Employment Details</h2>
          <div className="space-y-3">
            <InfoRow icon={Briefcase} label="Position" value={employee.position || 'N/A'} />
            <InfoRow icon={Building2} label="Department" value={employee.department || 'N/A'} />
            <InfoRow icon={Clock} label="Employment Type" value={employee.employment_type} capitalize />
            {isMaster && <InfoRow icon={MapPin} label="Site" value={siteName || 'Unassigned'} />}
            <InfoRow
              icon={DollarSign}
              label="Compensation"
              value={
                employee.employment_type === 'monthly'
                  ? `\u20B1${Number(employee.monthly_salary).toLocaleString('en-PH')}/month`
                  : `\u20B1${Number(employee.daily_rate).toLocaleString('en-PH')}/day`
              }
            />
            <InfoRow
              icon={DollarSign}
              label="Overtime Rate"
              value={`\u20B1${Number(employee.overtime_rate).toLocaleString('en-PH')}/hour`}
            />
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Attendance History</h2>
          <Link href="/dashboard/attendance" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
            View All Attendance
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Worked</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attendanceHistory && attendanceHistory.length > 0 ? (
                attendanceHistory.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{format(new Date(a.attendance_date + 'T00:00:00'), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${attStatusColor[a.status] || 'bg-slate-700 text-slate-300'}`}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{a.check_in_time || 'N/A'}</td>
                    <td className="px-5 py-3 text-slate-300">{a.check_out_time || 'N/A'}</td>
                    <td className="px-5 py-3 text-slate-300">{a.hours_worked || '0'}</td>
                    <td className="px-5 py-3 text-slate-300">{a.overtime_hours || '0'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Payroll History</h2>
          <Link href="/dashboard/payroll" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
            Manage Payroll
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay Period</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">OT Hours</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Pay</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payrollHistory && payrollHistory.length > 0 ? (
                payrollHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{p.pay_period}</td>
                    <td className="px-5 py-3 text-slate-300">{p.days_worked}</td>
                    <td className="px-5 py-3 text-slate-300">{p.overtime_hours}</td>
                    <td className="px-5 py-3 text-slate-300">{`\u20B1${Number(p.gross_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-400">{`\u20B1${Number(p.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}</td>
                    <td className="px-5 py-3 text-slate-500">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No payroll records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, capitalize }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-medium text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
