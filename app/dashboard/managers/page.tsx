'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Edit2, Trash2, AlertCircle, Shield, ShieldOff, KeyRound } from 'lucide-react';

type Manager = { id: string; manager_name: string; username: string; project_name: string; site_location: string; is_active: boolean; created_at: string };

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editManager, setEditManager] = useState<Manager | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/managers');
    const data = await res.json();
    setManagers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchManagers(); }, [fetchManagers]);

  async function handleDelete(id: string) { await fetch(`/api/managers/${id}`, { method: 'DELETE' }); fetchManagers(); setDeleteId(null); }
  async function toggleActive(m: Manager) { await fetch(`/api/managers/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !m.is_active }) }); fetchManagers(); }
  async function resetPassword(id: string, pw: string) { await fetch(`/api/managers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }); fetchManagers(); setResetId(null); }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Site Managers</h1><p className="text-slate-400 text-sm mt-1">{managers.length} managers</p></div>
        <button onClick={() => { setEditManager(null); setShowModal(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Add Manager</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-800">
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Manager</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project / Site</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
          <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
        </tr></thead><tbody className="divide-y divide-slate-800">
          {loading ? Array.from({ length: 3 }).map((_, i) => (<tr key={i}>{Array.from({ length: 5 }).map((_, j) => (<td key={j} className="px-5 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>))}</tr>))
          : managers.length === 0 ? (<tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No site managers yet</td></tr>)
          : managers.map(m => (
            <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-amber-400">{m.manager_name.charAt(0).toUpperCase()}</div><span className="font-medium text-white">{m.manager_name}</span></div></td>
              <td className="px-5 py-3 text-slate-300">{m.username}</td>
              <td className="px-5 py-3"><p className="text-white">{m.project_name || '—'}</p><p className="text-xs text-slate-500">{m.site_location || '—'}</p></td>
              <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.is_active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>{m.is_active ? 'Active' : 'Disabled'}</span></td>
              <td className="px-5 py-3"><div className="flex items-center justify-end gap-1">
                <button onClick={() => toggleActive(m)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors" title={m.is_active ? 'Disable' : 'Enable'}>{m.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}</button>
                <button onClick={() => setResetId(m.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Reset Password"><KeyRound className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setEditManager(m); setShowModal(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(m.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div></td>
            </tr>
          ))}
        </tbody></table></div>
      </div>

      {showModal && <ManagerModal manager={editManager} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchManagers(); }} />}
      {deleteId && <ConfirmDialog title="Delete Manager" message="This action cannot be undone." onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
      {resetId && <ResetPasswordModal managerId={resetId} onClose={() => setResetId(null)} onReset={(id, pw) => resetPassword(id, pw)} />}
    </div>
  );
}

function ManagerModal({ manager, onClose, onSaved }: { manager: Manager | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!manager;
  const [form, setForm] = useState({ manager_name: manager?.manager_name || '', username: manager?.username || '', password: '', project_name: manager?.project_name || '', site_location: manager?.site_location || '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSubmitting(true); setError('');
    try {
      const url = isEdit ? `/api/managers/${manager.id}` : '/api/managers';
      const body: Record<string, string> = { manager_name: form.manager_name.trim(), username: form.username.trim(), project_name: form.project_name.trim(), site_location: form.site_location.trim() };
      if (!isEdit || form.password) body.password = form.password;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      onSaved();
    } catch { setError('Network error'); } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800"><h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Manager' : 'Add Site Manager'}</h2><button onClick={onClose} className="text-slate-500 hover:text-white text-xl">&times;</button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Manager Name *" value={form.manager_name} onChange={v => setForm(f => ({ ...f, manager_name: v }))} required />
          <Field label="Username *" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} required disabled={isEdit} />
          <Field label={isEdit ? 'New Password (blank to keep)' : 'Password *'} value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" required={!isEdit} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project Name" value={form.project_name} onChange={v => setForm(f => ({ ...f, project_name: v }))} />
            <Field label="Site Location" value={form.site_location} onChange={v => setForm(f => ({ ...f, site_location: v }))} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors">{submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ managerId, onClose, onReset }: { managerId: string; onClose: () => void; onReset: (id: string, pw: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (password.length < 8) { setError('Min. 8 characters'); return; } onReset(managerId, password); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800"><h2 className="text-lg font-semibold text-white">Reset Password</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="New Password (min. 8 chars)" value={password} onChange={setPassword} type="password" required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors">Reset</button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; disabled?: boolean }) {
  return (<div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} disabled={disabled} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-50" /></div>);
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"><div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-400" /></div><div><h3 className="text-white font-semibold">{title}</h3><p className="text-slate-400 text-sm">{message}</p></div></div><div className="flex gap-3"><button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors">Delete</button></div></div></div>);
}
