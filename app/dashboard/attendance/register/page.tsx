'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, ArrowLeft, Save, AlertCircle, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DEFAULT_TIMES, STATUS_OPTIONS, calcHoursWorked, getDefaultsForStatus, statusUsesTime } from '@/lib/attendance';

type Employee = {
  id: string;
  employee_number: string;
  full_name: string;
  employment_type: string;
};

type Site = { id: string; project_name: string };
type SessionInfo = { role: string; siteId?: string };

type RowState = {
  status: string;
  check_in: string;
  check_out: string;
  overtime_hours: string;
  hours_worked: number;
};

function StatusButton({ status, selected, onClick }: { status: string; selected: boolean; onClick: () => void }) {
  const colors: Record<string, string> = {
    Present: selected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20',
    Absent: selected ? 'bg-red-400 text-slate-950' : 'bg-red-400/10 text-red-400 hover:bg-red-400/20',
    'Sick Leave': selected ? 'bg-amber-400 text-slate-950' : 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20',
    'Annual Leave': selected ? 'bg-blue-400 text-slate-950' : 'bg-blue-400/10 text-blue-400 hover:bg-blue-400/20',
    'Half Day': selected ? 'bg-orange-400 text-slate-950' : 'bg-orange-400/10 text-orange-400 hover:bg-orange-400/20',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${colors[status]}`}
    >
      {status}
    </button>
  );
}

export default function DailyRegisterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => setSession(d)).catch(() => {}); }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const empRes = await fetch('/api/employees?status=active');
      const empData = await empRes.json();
      const emps = Array.isArray(empData) ? empData : [];
      setEmployees(emps);

      // Load existing attendance for this date
      const attRes = await fetch(`/api/attendance?date=${selectedDate}`);
      const attData = await attRes.json();
      const records = Array.isArray(attData) ? attData : [];

      const existing: Record<string, string> = {};
      const initialRows: Record<string, RowState> = {};

      for (const emp of emps) {
        const rec = records.find((r: any) => r.employee_id === emp.id);
        if (rec) {
          existing[emp.id] = rec.id;
          initialRows[emp.id] = {
            status: rec.status,
            check_in: rec.check_in_time || '',
            check_out: rec.check_out_time || '',
            overtime_hours: String(rec.overtime_hours || 0),
            hours_worked: rec.hours_worked || 0,
          };
        } else {
          const d = DEFAULT_TIMES.Present;
          initialRows[emp.id] = {
            status: 'Present',
            check_in: d.check_in,
            check_out: d.check_out,
            overtime_hours: '0',
            hours_worked: d.hours_worked,
          };
        }
      }

      setExistingRecords(existing);
      setRows(initialRows);
      setLoading(false);
    }
    loadData();
  }, [selectedDate]);

  function updateRow(empId: string, field: keyof RowState, value: string | number) {
    setRows(prev => {
      const current = prev[empId];
      const updated = { ...current, [field]: value };

      if (field === 'status') {
        const d = getDefaultsForStatus(String(value));
        updated.check_in = d.check_in;
        updated.check_out = d.check_out;
        updated.hours_worked = d.hours_worked;
      } else if (field === 'check_in' || field === 'check_out') {
        if (updated.check_in && updated.check_out) {
          updated.hours_worked = calcHoursWorked(updated.check_in, updated.check_out);
        }
      }
      return { ...prev, [empId]: updated };
    });
  }

  function markAllStatus(status: string) {
    const d = getDefaultsForStatus(status);
    setRows(prev => {
      const next = { ...prev };
      for (const empId of Object.keys(next)) {
        next[empId] = {
          ...next[empId],
          status,
          check_in: d.check_in,
          check_out: d.check_out,
          hours_worked: d.hours_worked,
        };
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const records = employees.map(emp => {
        const row = rows[emp.id];
        return {
          employee_id: emp.id,
          employee_number: emp.employee_number,
          employee_name: emp.full_name,
          status: row.status,
          check_in_time: statusUsesTime(row.status) ? row.check_in || null : null,
          check_out_time: statusUsesTime(row.status) ? row.check_out || null : null,
          hours_worked: row.hours_worked || 0,
          overtime_hours: Number(row.overtime_hours) || 0,
        };
      });

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_date: selectedDate, records }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save attendance');
        return;
      }

      setSuccess(true);
      // Reload to refresh existing records state
      setTimeout(() => {
        setSuccess(false);
        fetch(`/api/attendance?date=${selectedDate}`)
          .then(r => r.json())
          .then(d => {
            const recs = Array.isArray(d) ? d : [];
            const existing: Record<string, string> = {};
            for (const r of recs) {
              existing[r.employee_id] = r.id;
            }
            setExistingRecords(existing);
          });
      }, 1000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const presentCount = Object.values(rows).filter(r => r.status === 'Present').length;
  const absentCount = Object.values(rows).filter(r => r.status === 'Absent').length;
  const leaveCount = Object.values(rows).filter(r => ['Sick Leave', 'Annual Leave'].includes(r.status)).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/attendance"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Attendance
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Attendance Register</h1>
            <p className="text-slate-400 text-sm mt-0.5">Mark attendance for all employees at once</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-500">Present</p>
          <p className="text-lg font-bold text-emerald-400">{presentCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-500">Absent</p>
          <p className="text-lg font-bold text-red-400">{absentCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-500">On Leave</p>
          <p className="text-lg font-bold text-amber-400">{leaveCount}</p>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => markAllStatus('Present')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors border border-emerald-400/20"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark All Present
        </button>
        <button
          type="button"
          onClick={() => markAllStatus('Absent')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors border border-red-400/20"
        >
          <XCircle className="w-3.5 h-3.5" />
          Mark All Absent
        </button>
        <span className="text-slate-700">|</span>
        <span className="text-xs text-slate-500">Set all:</span>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => markAllStatus(s)}
            className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Register table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Emp #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[300px]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hrs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">OT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No active employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => {
                  const row = rows[emp.id] || { status: 'Present', check_in: '', check_out: '', overtime_hours: '0', hours_worked: 0 };
                  const showTime = statusUsesTime(row.status);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{emp.employee_number}</td>
                      <td className="px-4 py-3 font-medium text-white">{emp.full_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {STATUS_OPTIONS.map(s => (
                            <StatusButton
                              key={s}
                              status={s}
                              selected={row.status === s}
                              onClick={() => updateRow(emp.id, 'status', s)}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {showTime ? (
                          <input
                            type="time"
                            value={row.check_in}
                            onChange={e => updateRow(emp.id, 'check_in', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 w-24"
                          />
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {showTime ? (
                          <input
                            type="time"
                            value={row.check_out}
                            onChange={e => updateRow(emp.id, 'check_out', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 w-24"
                          />
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {showTime && row.check_in && row.check_out ? `${row.hours_worked}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {showTime ? (
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={row.overtime_hours}
                            onChange={e => updateRow(emp.id, 'overtime_hours', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 w-16"
                          />
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">Attendance saved successfully!</p>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || employees.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
}
