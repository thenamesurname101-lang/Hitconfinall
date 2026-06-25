'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Upload, Search, Download, Trash2, AlertCircle,
  File, FileSpreadsheet, X, CheckCircle2, MapPin
} from 'lucide-react';
import { format } from 'date-fns';

type Site = { id: string; project_name: string };
type SessionInfo = { role: string; siteId?: string };

type Report = {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  site_id?: string;
  created_at: string;
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-400" />;
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  return <File className="w-5 h-5 text-blue-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => setSession(d)).catch(() => {}); }, []);
  const isMaster = session?.role === 'master';
  useEffect(() => { if (isMaster) fetch('/api/sites').then(r => r.json()).then(d => setSites(Array.isArray(d) ? d : [])).catch(() => {}); }, [isMaster]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (isMaster && siteFilter) params.set('site_id', siteFilter);
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, siteFilter, isMaster]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleDelete(id: string) {
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    fetchReports();
    setDeleteId(null);
  }

  async function handleDownload(id: string, fileName: string) {
    const res = await fetch(`/api/reports/${id}`);
    const data = await res.json();
    if (data.download_url) {
      const a = document.createElement('a');
      a.href = data.download_url;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">{reports.length} files uploaded</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Report
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
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

      {/* Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">File</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded By</th>
                {isMaster && <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Site</th>}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isMaster ? 7 : 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={isMaster ? 7 : 6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-500" />
                      </div>
                      <p className="text-slate-400 font-medium">No reports yet</p>
                      <p className="text-slate-600 text-xs">Upload PDF, DOCX, XLSX, or CSV files</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                          <FileIcon name={report.file_name} />
                        </div>
                        <span className="text-slate-300 text-xs truncate max-w-32">{report.file_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{report.title}</td>
                    <td className="px-5 py-3 text-slate-400">{formatSize(report.file_size)}</td>
                    <td className="px-5 py-3 text-slate-400">{report.uploaded_by}</td>
                    {isMaster && (
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {sites.find(s => s.id === report.site_id)?.project_name || '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-400">{format(new Date(report.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(report.id, report.file_name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(report.id)}
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

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); fetchReports(); }} />
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
                <h3 className="text-white font-semibold">Delete Report</h3>
                <p className="text-slate-400 text-sm">This will permanently delete the file.</p>
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

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTS = ['.pdf', '.docx', '.xlsx', '.csv', '.doc', '.xls'];

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) { setError('Both title and file are required'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('file', file);
      const res = await fetch('/api/reports', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      setSuccess(true);
      setTimeout(onUploaded, 800);
    } catch { setError('Network error'); }
    finally { setUploading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Upload Report</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">&times;</button>
        </div>
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Report Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Monthly Safety Report - June 2024"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700 hover:border-slate-600'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.doc,.xls"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-300">Drop file here or <span className="text-amber-400">browse</span></p>
                <p className="text-xs text-slate-500">PDF, DOCX, XLSX, CSV — max 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-400">Report uploaded successfully!</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={uploading || !file} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-semibold transition-colors">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
