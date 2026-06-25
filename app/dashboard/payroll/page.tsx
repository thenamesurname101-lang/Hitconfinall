'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Plus, Search, Download, Trash2, AlertCircle,
  Calculator, ChevronRight, MapPin, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { Employee } from '@/lib/supabase/types';

type Site = { id: string; project_name: string };
type SessionInfo = { role: string; siteId?: string };

type PayrollRecord = {
  id: string;
  employee_id: string;
  pay_period: string;
  employee_type: string;
  days_worked: number;
  overtime_hours: number;
  allowances: number;
  deductions: number;
  gross_pay: number;
  net_pay: number;
  site_id?: string;
  created_at: string;
  employees: { id: string; full_name: string; employee_number: string; employment_type: string } | null;
};

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'generate'>('history');

  useEffect(() => { fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => setSession(d)).catch(() => {}); }, []);
  const isMaster = session?.role === 'master';
  useEffect(() => { if (isMaster) fetch('/api/sites').then(r => r.json()).then(d => setSites(Array.isArray(d) ? d : [])).catch(() => {}); }, [isMaster]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPeriod) params.set('pay_period', filterPeriod);
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/payroll?${params}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filterPeriod, siteFilter, isMaster]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    fetch('/api/employees?status=active')
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : []));
  }, []);

  const filtered = records.filter(r =>
    !search ||
    r.employees?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.employees?.employee_number.toLowerCase().includes(search.toLowerCase()) ||
    r.pay_period.includes(search)
  );

  async function handleDelete(id: string) {
    await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
    fetchRecords();
    setDeleteId(null);
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (filterPeriod) params.set('pay_period', filterPeriod);
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/exports/payroll?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalGross = filtered.reduce((s, r) => s + Number(r.gross_pay), 0);
  const totalNet = filtered.reduce((s, r) => s + Number(r.net_pay), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-slate-400 text-sm mt-1">{records.length} total records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => { setShowModal(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Payroll
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Records" value={filtered.length.toString()} />
        <SummaryCard label="Total Gross Pay" value={`₱${totalGross.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} highlight />
        <SummaryCard label="Total Net Pay" value={`₱${totalNet.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} highlight />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by employee name, ID, or pay period..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <input
          type="month"
          value={filterPeriod}
          onChange={e => setFilterPeriod(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        {isMaster && (
          <select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.project_name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">OT Hrs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Allowances</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Pay</th>
                {isMaster && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Site</th>}
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isMaster ? 11 : 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isMaster ? 11 : 10} className="px-4 py-12 text-center text-slate-500">
                    No payroll records found
                  </td>
                </tr>
              ) : (
                filtered.map(record => (
                  <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{record.employees?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{record.employees?.employee_number}</p>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{record.pay_period}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${record.employee_type === 'monthly' ? 'bg-blue-400/10 text-blue-400' : 'bg-teal-400/10 text-teal-400'}`}>
                        {record.employee_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{record.days_worked}</td>
                    <td className="px-4 py-3 text-slate-300">{record.overtime_hours}</td>
                    <td className="px-4 py-3 text-slate-300">₱{Number(record.allowances).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-red-400">₱{Number(record.deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-slate-300">₱{Number(record.gross_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">₱{Number(record.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    {isMaster && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {sites.find(s => s.id === record.site_id)?.project_name || '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteId(record.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <PayrollModal
          employees={employees}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchRecords(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Delete Record</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function PayrollModal({ employees, onClose, onSaved }: {
  employees: Employee[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [payPeriod, setPayPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [daysWorked, setDaysWorked] = useState('22');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ gross: number; net: number } | null>(null);
  const [attSummary, setAttSummary] = useState<{ days_present: number; effective_days_worked: number; total_overtime_hours: number } | null>(null);
  const [loadingAtt, setLoadingAtt] = useState(false);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const isMonthly = selectedEmp?.employment_type === 'monthly';

  function calcPreview() {
    if (!selectedEmp) return;
    const otPay = Number(overtimeHours) * Number(selectedEmp.overtime_rate);
    const deduct = Number(deductions);
    const allow = Number(allowances);

    let gross = 0;
    if (isMonthly) {
      gross = Number(selectedEmp.monthly_salary) + otPay + allow;
    } else {
      gross = Number(selectedEmp.daily_rate) * Number(daysWorked) + otPay;
    }
    setPreview({ gross, net: gross - deduct });
  }

  useEffect(() => { calcPreview(); }, [selectedEmpId, daysWorked, overtimeHours, allowances, deductions]);

  async function fetchAttendanceSummary() {
    if (!selectedEmpId || !payPeriod) return;
    setLoadingAtt(true);
    const [year, month] = payPeriod.split('-');
    const from = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const to = `${year}-${month}-${lastDay}`;
    try {
      const res = await fetch(`/api/attendance/summary?employee_id=${selectedEmpId}&from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setAttSummary(data);
        setDaysWorked(String(data.effective_days_worked));
        setOvertimeHours(String(data.total_overtime_hours));
      }
    } catch { /* ignore */ }
    finally { setLoadingAtt(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmp) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmpId,
          pay_period: payPeriod,
          employee_type: isMonthly ? 'monthly' : 'weekly',
          days_worked: Number(daysWorked),
          overtime_hours: Number(overtimeHours),
          allowances: Number(allowances),
          deductions: Number(deductions),
          base_salary: selectedEmp.monthly_salary,
          daily_rate: selectedEmp.daily_rate,
          overtime_rate: selectedEmp.overtime_rate,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      onSaved();
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Generate Payroll</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Employee *</label>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Select employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.employee_number}) — {e.employment_type}
                </option>
              ))}
            </select>
          </div>

          {/* Pay period */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Pay Period *</label>
            <input
              type="month"
              value={payPeriod}
              onChange={e => setPayPeriod(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {selectedEmp && (
            <>
              {/* Rate info */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm">
                <p className="text-slate-400">
                  <span className="text-white font-medium">{selectedEmp.full_name}</span>
                  {' '}&bull; {selectedEmp.employment_type} &bull;{' '}
                  {isMonthly
                    ? `₱${Number(selectedEmp.monthly_salary).toLocaleString('en-PH')}/month`
                    : `₱${Number(selectedEmp.daily_rate).toLocaleString('en-PH')}/day`}
                  {' '}&bull; OT: ₱{Number(selectedEmp.overtime_rate).toLocaleString('en-PH')}/hr
                </p>
              </div>

              {/* Auto-fill from attendance */}
              <button
                type="button"
                onClick={fetchAttendanceSummary}
                disabled={loadingAtt}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
              >
                <ClipboardList className="w-4 h-4" />
                {loadingAtt ? 'Loading...' : 'Auto-fill from Attendance'}
              </button>

              {attSummary && (
                <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-lg p-3 text-xs">
                  <p className="text-emerald-400 font-semibold mb-1">Attendance Summary for {payPeriod}</p>
                  <div className="grid grid-cols-3 gap-2 text-slate-400">
                    <div>Present: <span className="text-white">{attSummary.days_present}</span></div>
                    <div>Effective Days: <span className="text-white">{attSummary.effective_days_worked}</span></div>
                    <div>OT Hours: <span className="text-white">{attSummary.total_overtime_hours}</span></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!isMonthly && (
                  <NumField label="Days Worked" value={daysWorked} onChange={setDaysWorked} />
                )}
                <NumField label="Overtime Hours" value={overtimeHours} onChange={setOvertimeHours} />
                {isMonthly && (
                  <NumField label="Allowances (₱)" value={allowances} onChange={setAllowances} />
                )}
                <NumField label="Deductions (₱)" value={deductions} onChange={setDeductions} />
              </div>

              {/* Preview */}
              {preview && (
                <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-lg p-4">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Payroll Preview</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross Pay</span>
                      <span className="text-white font-medium">₱{preview.gross.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deductions</span>
                      <span className="text-red-400">-₱{Number(deductions).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1.5">
                      <span className="text-slate-300 font-medium">Net Pay</span>
                      <span className="text-emerald-400 font-bold text-base">₱{preview.net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || !selectedEmpId} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors">
              {submitting ? 'Saving...' : 'Save Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}
