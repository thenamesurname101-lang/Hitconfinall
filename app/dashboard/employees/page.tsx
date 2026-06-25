'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Download, Edit2, Trash2, AlertCircle } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Construction', 'Administration', 'Finance', 'HR', 'Operations', 'Safety'];
const STATUSES = ['active', 'inactive', 'terminated'];
const EMPLOYMENT_TYPES = ['monthly', 'weekly', 'daily'];

type Site = { id: string; project_name: string };
type SessionInfo = { role: string; siteId?: string };

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = { active: 'bg-emerald-400/10 text-emerald-400', inactive: 'bg-amber-400/10 text-amber-400', terminated: 'bg-red-400/10 text-red-400' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${m[status] || 'bg-slate-700 text-slate-300'}`}>{status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const m: Record<string, string> = { monthly: 'bg-blue-400/10 text-blue-400', weekly: 'bg-teal-400/10 text-teal-400', daily: 'bg-orange-400/10 text-orange-400' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${m[type] || 'bg-slate-700 text-slate-300'}`}>{type}</span>;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => setSession(d)).catch(() => {}); }, []);
  const isMaster = session?.role === 'master';

  useEffect(() => { if (isMaster) fetch('/api/sites').then(r => r.json()).then(d => setSites(Array.isArray(d) ? d : [])).catch(() => {}); }, [isMaster]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('employment_type', typeFilter);
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/employees?${params}`);
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, statusFilter, typeFilter, siteFilter, isMaster]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function openAdd() { setEditEmployee(null); setShowModal(true); }
  function openEdit(emp: any) { setEditEmployee(emp); setShowModal(true); }
  async function handleDelete(id: string) { const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' }); if (res.ok) { fetchEmployees(); setDeleteId(null); } }
  async function handleExport() {
    const params = new URLSearchParams();
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/exports/employees?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Employees</h1><p className="text-slate-400 text-sm mt-1">{employees.length} records</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700"><Download className="w-4 h-4" />Export CSV</button>
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"><Plus className="w-4 h-4" />Add Employee</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" placeholder="Search by name, ID, department..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"><option value="">All Statuses</option>{STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"><option value="">All Types</option>{EMPLOYMENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}</select>
        {isMaster && <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"><option value="">All Sites</option>{sites.map(s => <option key={s.id} value={s.id}>{s.project_name}</option>)}</select>}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-800">
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
          {isMaster && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Site</th>}
          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
        </tr></thead><tbody className="divide-y divide-slate-800">
          {loading ? Array.from({ length: 5 }).map((_, i) => (<tr key={i}>{Array.from({ length: isMaster ? 7 : 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>))}</tr>))
          : employees.length === 0 ? (<tr><td colSpan={isMaster ? 7 : 6} className="px-4 py-12 text-center text-slate-500">No employees found</td></tr>)
          : employees.map(emp => {
            const siteName = sites.find(s => s.id === emp.site_id)?.project_name || '';
            return (<tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3"><Link href={`/dashboard/employees/${emp.id}`} className="font-medium text-white hover:text-amber-400 transition-colors">{emp.full_name}</Link><p className="text-xs text-slate-500">{emp.employee_number}</p></td>
              <td className="px-4 py-3"><p className="text-white">{emp.department || '—'}</p><p className="text-xs text-slate-500">{emp.position || '—'}</p></td>
              <td className="px-4 py-3"><TypeBadge type={emp.employment_type} /></td>
              <td className="px-4 py-3 text-white">{emp.employment_type === 'monthly' ? `₱${Number(emp.monthly_salary).toLocaleString('en-PH')}/mo` : `₱${Number(emp.daily_rate).toLocaleString('en-PH')}/day`}</td>
              <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
              {isMaster && <td className="px-4 py-3 text-slate-400 text-xs">{siteName || '—'}</td>}
              <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(emp.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div></td>
            </tr>);
          })}
        </tbody></table></div>
      </div>

      {showModal && <EmployeeModal employee={editEmployee} sites={sites} isMaster={isMaster} sessionSiteId={session?.siteId} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchEmployees(); }} />}
      {deleteId && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"><div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-400" /></div><div><h3 className="text-white font-semibold">Delete Employee</h3><p className="text-slate-400 text-sm">This action cannot be undone.</p></div></div><div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button onClick={() => handleDelete(deleteId!)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors">Delete</button></div></div></div>}
    </div>
  );
}

function EmployeeModal({ employee, sites, isMaster, sessionSiteId, onClose, onSaved }: { employee: any | null; sites: Site[]; isMaster: boolean; sessionSiteId?: string; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    employee_number: employee?.employee_number || '', full_name: employee?.full_name || '', national_id: employee?.national_id || '',
    phone_number: employee?.phone_number || '', position: employee?.position || '', department: employee?.department || '',
    employment_type: employee?.employment_type || 'monthly', daily_rate: employee?.daily_rate?.toString() || '0',
    weekly_wage: employee?.weekly_wage?.toString() || '0', monthly_salary: employee?.monthly_salary?.toString() || '0',
    overtime_rate: employee?.overtime_rate?.toString() || '0', date_hired: employee?.date_hired || '',
    status: employee?.status || 'active', site_id: employee?.site_id || sessionSiteId || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = isEdit ? `/api/employees/${employee.id}` : '/api/employees';
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      onSaved();
    } catch { setError('Network error'); } finally { setSubmitting(false); }
  }

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800"><h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2><button onClick={onClose} className="text-slate-500 hover:text-white text-xl">&times;</button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee Number *" value={form.employee_number} onChange={v => set('employee_number', v)} required />
            <Field label="Full Name *" value={form.full_name} onChange={v => set('full_name', v)} required />
            <Field label="National ID *" value={form.national_id} onChange={v => set('national_id', v)} required />
            <Field label="Phone Number" value={form.phone_number} onChange={v => set('phone_number', v)} />
            <Field label="Position" value={form.position} onChange={v => set('position', v)} />
            <Select label="Department" value={form.department} onChange={v => set('department', v)} options={['', ...DEPARTMENTS]} />
            <Select label="Employment Type" value={form.employment_type} onChange={v => set('employment_type', v)} options={EMPLOYMENT_TYPES} capitalize />
            <Select label="Status" value={form.status} onChange={v => set('status', v)} options={STATUSES} capitalize />
            {form.employment_type === 'monthly' && <Field label="Monthly Salary (₱)" type="number" value={form.monthly_salary} onChange={v => set('monthly_salary', v)} />}
            {(form.employment_type === 'weekly' || form.employment_type === 'daily') && <Field label="Daily Rate (₱)" type="number" value={form.daily_rate} onChange={v => set('daily_rate', v)} />}
            {form.employment_type === 'weekly' && <Field label="Weekly Wage (₱)" type="number" value={form.weekly_wage} onChange={v => set('weekly_wage', v)} />}
            <Field label="Overtime Rate (₱/hr)" type="number" value={form.overtime_rate} onChange={v => set('overtime_rate', v)} />
            <Field label="Date Hired" type="date" value={form.date_hired} onChange={v => set('date_hired', v)} />
            {isMaster && <Select label="Site" value={form.site_id} onChange={v => set('site_id', v)} options={['', ...sites.map(s => s.id)]} optionLabels={['No site', ...sites.map(s => s.project_name)]} />}
          </div>
          {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-sm text-red-400">{error}</p></div>}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors">{submitting ? 'Saving...' : isEdit ? 'Update' : 'Add Employee'}</button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (<div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500" /></div>);
}

function Select({ label, value, onChange, options, capitalize = false, optionLabels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; capitalize?: boolean; optionLabels?: string[] }) {
  return (<div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">{label}</label><select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">{options.map((o, i) => { const d = optionLabels?.[i] ?? (capitalize ? o.charAt(0).toUpperCase() + o.slice(1) : (o || 'Select...')); return <option key={o + i} value={o}>{d}</option>; })}</select></div>);
}
