'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock, Plus, Search, Download, Trash2, AlertCircle,
  Edit2, Calendar, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { DEFAULT_TIMES, STATUS_OPTIONS, calcHoursWorked, getDefaultsForStatus, statusUsesTime } from '@/lib/attendance';

type Site = { id: string; project_name: string };
type SessionInfo = { role: string; siteId?: string };

type AttendanceRecord = {
  id: string;
  employee_id: string;
  employee_number: string;
  employee_name: string;
  attendance_date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number;
  overtime_hours: number;
  notes: string;
  site_id?: string;
  created_at: string;
};

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    Present: 'bg-emerald-400/10 text-emerald-400',
    Absent: 'bg-red-400/10 text-red-400',
    'Sick Leave': 'bg-amber-400/10 text-amber-400',
    'Annual Leave': 'bg-blue-400/10 text-blue-400',
    'Half Day': 'bg-orange-400/10 text-orange-400',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m[status] || 'bg-slate-700 text-slate-300'}`}>{status}</span>;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterStatus, setFilterStatus] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'register'>('records');

  useEffect(() => { fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => setSession(d)).catch(() => {}); }, []);
  const isMaster = session?.role === 'master';
  useEffect(() => { if (isMaster) fetch('/api/sites').then(r => r.json()).then(d => setSites(Array.isArray(d) ? d : [])).catch(() => {}); }, [isMaster]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterDate) params.set('date', filterDate);
    if (filterStatus) params.set('status', filterStatus);
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/attendance?${params}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, filterDate, filterStatus, siteFilter, isMaster]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  async function handleDelete(id: string) {
    await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
    fetchRecords();
    setDeleteId(null);
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (filterDate) params.set('date', filterDate);
    if (filterStatus) params.set('status', filterStatus);
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/exports/attendance?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openEdit(rec: AttendanceRecord) {
    setEditRecord(rec);
    setShowModal(true);
  }

  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const leaveCount = records.filter(r => ['Sick Leave', 'Annual Leave'].includes(r.status)).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-400 text-sm mt-1">{records.length} records for selected filters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/dashboard/attendance/register"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700"
          >
            <ClipboardList className="w-4 h-4" />
            Daily Register
          </Link>
          <button
            onClick={() => { setEditRecord(null); setShowModal(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Records" value={records.length.toString()} />
        <SummaryCard label="Present" value={presentCount.toString()} color="text-emerald-400" />
        <SummaryCard label="Absent" value={absentCount.toString()} color="text-red-400" />
        <SummaryCard label="On Leave" value={leaveCount.toString()} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by employee name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Emp #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hrs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">OT</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{rec.employee_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{rec.employee_name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{format(new Date(rec.attendance_date + 'T00:00:00'), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>
                    <td className="px-4 py-3 text-slate-300">{rec.check_in_time || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{rec.check_out_time || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{rec.hours_worked || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{rec.overtime_hours || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(rec.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <AttendanceModal
          record={editRecord}
          session={session}
          sites={sites}
          onClose={() => { setShowModal(false); setEditRecord(null); }}
          onSaved={() => { setShowModal(false); setEditRecord(null); fetchRecords(); }}
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

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

type Employee = {
  id: string;
  employee_number: string;
  full_name: string;
  employment_type: string;
  site_id?: string;
};

function AttendanceModal({ record, session, sites, onClose, onSaved }: {
  record: AttendanceRecord | null;
  session: SessionInfo | null;
  sites: Site[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!record;
  const isMaster = session?.role === 'master';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(record?.employee_id || '');
  const [attendanceDate, setAttendanceDate] = useState(record?.attendance_date || format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState(record?.status || 'Present');
  const [checkIn, setCheckIn] = useState(record?.check_in_time || (record ? '' : DEFAULT_TIMES.Present.check_in));
  const [checkOut, setCheckOut] = useState(record?.check_out_time || (record ? '' : DEFAULT_TIMES.Present.check_out));
  const [overtimeHours, setOvertimeHours] = useState(String(record?.overtime_hours || 0));
  const [notes, setNotes] = useState(record?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/employees?status=active')
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : []));
  }, []);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    const d = getDefaultsForStatus(newStatus);
    setCheckIn(d.check_in);
    setCheckOut(d.check_out);
  }

  const hoursWorked = statusUsesTime(status) && checkIn && checkOut ? calcHoursWorked(checkIn, checkOut) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        employee_id: selectedEmpId,
        employee_number: selectedEmp?.employee_number || '',
        employee_name: selectedEmp?.full_name || '',
        attendance_date: attendanceDate,
        status,
        check_in_time: statusUsesTime(status) ? checkIn || null : null,
        check_out_time: statusUsesTime(status) ? checkOut || null : null,
        hours_worked: hoursWorked,
        overtime_hours: Number(overtimeHours) || 0,
        notes,
      };

      let res;
      if (isEdit && record) {
        res = await fetch(`/api/attendance/${record.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
        return;
      }
      onSaved();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Attendance' : 'Add Attendance'}</h2>
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
              disabled={isEdit}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              <option value="">Select employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.employee_number})
                </option>
              ))}
            </select>
          </div>

          {/* Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Date *</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                required
                disabled={isEdit}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Status *</label>
              <select
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Time tracking for Present/Half Day */}
          {statusUsesTime(status) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Check In</label>
                  <input
                    type="time"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Check Out</label>
                  <input
                    type="time"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Calculated hours */}
              {checkIn && checkOut && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hours Worked (auto-calculated)</span>
                    <span className="text-white font-medium">{hoursWorked} hrs</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Overtime Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={overtimeHours}
                  onChange={e => setOvertimeHours(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || (!isEdit && !selectedEmpId)} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors">
              {submitting ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
