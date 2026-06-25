'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit2, Trash2, AlertCircle, Building2, Users, DollarSign, FileText } from 'lucide-react';

type Site = {
  id: string; project_name: string; location: string; manager_id: string | null; created_at: string;
  site_managers: { id: string; manager_name: string; username: string; is_active: boolean } | null;
};

type Manager = { id: string; manager_name: string; username: string; is_active: boolean };

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, { employees: number; payroll: number; reports: number }>>({});
  const [showModal, setShowModal] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    const [sitesRes, managersRes, empRes, payRes, repRes] = await Promise.all([
      fetch('/api/sites'), fetch('/api/managers'), fetch('/api/employees'), fetch('/api/payroll'), fetch('/api/reports'),
    ]);
    const [sitesData, managersData, empData, payData, repData] = await Promise.all([
      sitesRes.json(), managersRes.json(), empRes.json(), payRes.json(), repRes.json(),
    ]);
    setSites(Array.isArray(sitesData) ? sitesData : []);
    setManagers(Array.isArray(managersData) ? managersData : []);
    const c: Record<string, { employees: number; payroll: number; reports: number }> = {};
    (sitesData || []).forEach((s: Site) => { c[s.id] = { employees: 0, payroll: 0, reports: 0 }; });
    (empData || []).forEach((e: any) => { if (e.site_id && c[e.site_id]) c[e.site_id].employees++; });
    (payData || []).forEach((p: any) => { if (p.site_id && c[p.site_id]) c[p.site_id].payroll++; });
    (repData || []).forEach((r: any) => { if (r.site_id && c[r.site_id]) c[r.site_id].reports++; });
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  async function handleDelete(id: string) {
    await fetch(`/api/sites/${id}`, { method: 'DELETE' });
    fetchSites(); setDeleteId(null);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Sites</h1><p className="text-slate-400 text-sm mt-1">{sites.length} project sites</p></div>
        <button onClick={() => { setEditSite(null); setShowModal(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse"><div className="h-5 bg-slate-800 rounded w-1/2 mb-3" /><div className="h-4 bg-slate-800 rounded w-1/3" /></div>
        )) : sites.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-16 text-center">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" /><p className="text-slate-400 font-medium">No sites yet</p><p className="text-slate-600 text-sm mt-1">Create your first project site</p>
          </div>
        ) : sites.map(site => {
          const c = counts[site.id] || { employees: 0, payroll: 0, reports: 0 };
          return (
            <div key={site.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-amber-400" /></div>
                  <div><h3 className="text-sm font-semibold text-white">{site.project_name}</h3><p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{site.location || 'No location'}</p></div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditSite(site); setShowModal(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(site.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {site.site_managers ? (
                <div className="flex items-center gap-2 mb-4 text-xs"><Users className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-300">{site.site_managers.manager_name}</span><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${site.site_managers.is_active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>{site.site_managers.is_active ? 'Active' : 'Inactive'}</span></div>
              ) : <p className="text-xs text-slate-600 mb-4">No manager assigned</p>}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                <div className="text-center"><p className="text-lg font-bold text-white">{c.employees}</p><p className="text-[10px] text-slate-500 uppercase">Employees</p></div>
                <div className="text-center"><p className="text-lg font-bold text-white">{c.payroll}</p><p className="text-[10px] text-slate-500 uppercase">Payroll</p></div>
                <div className="text-center"><p className="text-lg font-bold text-white">{c.reports}</p><p className="text-[10px] text-slate-500 uppercase">Reports</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <SiteModal site={editSite} managers={managers} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchSites(); }} />}
      {deleteId && <ConfirmDialog title="Delete Site" message="Employees, payroll, and reports will lose their site assignment." onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}

function SiteModal({ site, managers, onClose, onSaved }: { site: Site | null; managers: Manager[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!site;
  const [form, setForm] = useState({ project_name: site?.project_name || '', location: site?.location || '', manager_id: site?.manager_id || '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = isEdit ? `/api/sites/${site.id}` : '/api/sites';
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, manager_id: form.manager_id || null }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      onSaved();
    } catch { setError('Network error'); } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800"><h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Site' : 'Add Site'}</h2><button onClick={onClose} className="text-slate-500 hover:text-white text-xl">&times;</button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Project Name *</label><input type="text" value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} required placeholder="Metro Tower Construction" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Location</label><input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Makati City" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Assign Manager</label><select value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"><option value="">No manager</option>{managers.filter(m => m.is_active).map(m => <option key={m.id} value={m.id}>{m.manager_name} ({m.username})</option>)}</select></div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors">{submitting ? 'Saving...' : isEdit ? 'Update' : 'Create Site'}</button></div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-400" /></div><div><h3 className="text-white font-semibold">{title}</h3><p className="text-slate-400 text-sm">{message}</p></div></div>
        <div className="flex gap-3"><button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button><button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors">Delete</button></div>
      </div>
    </div>
  );
}
