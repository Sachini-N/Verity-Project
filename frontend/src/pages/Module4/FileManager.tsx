import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';

type ApiSubmission = {
  id: string;
  originalName: string;
  filePath: string;
  status: string;
  createdAt: string;
  uploader?: {
    id: string;
    name: string;
    indexNumber: string | null;
    email: string;
  };
};

type FileCard = {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  date: string;
  versions: number;
  status: string;
  createdAt: string;
  canDownload: boolean;
};

type CreateDocumentForm = {
  documentName: string;
  branch: string;
  notes: string;
  file: File | null;
};

function detectFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return 'file';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'sql') return 'sql';
  if (ext === 'doc' || ext === 'docx') return 'doc';
  return ext;
}

function parseApproxSize(filePath: string): string {
  const match = filePath.match(/size\s*[:=]\s*([0-9.]+\s*(bytes|kb|mb|gb))/i);
  if (match?.[1]) return String(match[1]).toUpperCase();
  return 'N/A';
}

export default function FileManager() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'files' | 'recent'>('files');
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<CreateDocumentForm>({
    documentName: '',
    branch: 'main',
    notes: '',
    file: null
  });

  const fetchFiles = async (): Promise<void> => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      const resp = await fetch(`http://localhost:5000/api/submission/list/${id}`);
      if (!resp.ok) {
        throw new Error('Failed to load workspace files.');
      }

      const data = await resp.json();
      if (data.success && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions as ApiSubmission[]);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load workspace files.';
      setError(msg);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [id]);

  const files = useMemo(() => {
    const nameCount = new Map<string, number>();
    submissions.forEach((sub) => {
      const key = sub.originalName || 'Untitled';
      nameCount.set(key, (nameCount.get(key) || 0) + 1);
    });

    return submissions.map((sub) => ({
      id: sub.id,
      name: sub.originalName || 'Untitled',
      size: parseApproxSize(sub.filePath || ''),
      type: detectFileType(sub.originalName || ''),
      uploadedBy: sub.uploader?.name || 'Unknown',
      date: new Date(sub.createdAt).toLocaleString(),
      versions: nameCount.get(sub.originalName || 'Untitled') || 1,
      status: sub.status || 'Submitted',
      createdAt: sub.createdAt,
      canDownload: /Stored:\s*([^|]+)/i.test(sub.filePath || '')
    })) as FileCard[];
  }, [submissions]);

  const recentFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [files]);

  const displayFiles = activeTab === 'files' ? files : recentFiles;

  const activityItems = useMemo(() => {
    return [...files]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [files]);

  const onCreateDocument = async (): Promise<void> => {
    if (!id) return;

    const uploadedFile = form.file;
    if (!uploadedFile) {
      setError('Please select a file to upload.');
      return;
    }

    const documentName = form.documentName.trim() || uploadedFile.name;

    const userRaw = sessionStorage.getItem('user');
    let userId: string | null = null;
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        const user = parsed?.user || parsed;
        userId = user?.id || null;
      } catch {
        userId = null;
      }
    }

    try {
      setUploading(true);
      setError('');

      const body = new FormData();
      body.append('projectId', id);
      body.append('documentName', documentName);
      body.append('branch', form.branch.trim() || 'main');
      body.append('notes', form.notes.trim());
      body.append('status', 'Submitted');
      body.append('file', uploadedFile);
      if (userId) body.append('uploaderId', userId);

      const resp = await fetch('http://localhost:5000/api/submission/upload', {
        method: 'POST',
        body
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload document.');
      }

      setShowUploadModal(false);
      setForm({ documentName: '', branch: 'main', notes: '', file: null });
      await fetchFiles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (fileId: string): Promise<void> => {
    try {
      const resp = await fetch(`http://localhost:5000/api/submission/download/${fileId}`);
      if (!resp.ok) {
        let message = 'Failed to download file.';
        try {
          const data = await resp.json();
          message = data.message || message;
        } catch {
          // ignore parse failures for binary responses
        }
        throw new Error(message);
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to download file.';
      setError(msg);
    }
  };

  const onDelete = async (fileId: string): Promise<void> => {
    const ok = window.confirm('Are you sure you want to delete this file?');
    if (!ok) return;

    try {
      const resp = await fetch(`http://localhost:5000/api/submission/${fileId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete file.');
      }
      await fetchFiles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete file.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl p-8 border border-indigo-100 bg-white shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-600">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Workspace Files</h2>
            <p className="text-sm text-slate-500 mt-1">Centralized document management & version control</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-indigo-200"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex gap-6 border-b border-slate-200 mb-6 pb-px">
              <button
                className={`pb-3 px-2 text-sm font-semibold transition-colors relative ${activeTab === 'files' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('files')}
              >
                All Documents
                {activeTab === 'files' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
              </button>
              <button
                className={`pb-3 px-2 text-sm font-semibold transition-colors relative ${activeTab === 'recent' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('recent')}
              >
                Recent Uploads
                {activeTab === 'recent' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-500 font-semibold">Loading workspace files...</div>
            ) : displayFiles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl text-slate-500 font-semibold">
                No documents found for this project yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {displayFiles.map((file) => (
                  <div key={file.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm transition-all group cursor-pointer flex flex-col min-h-[252px]">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm border transition-transform group-hover:scale-105 shrink-0 ${
                          file.type === 'pdf'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : file.type === 'sql'
                            ? 'bg-sky-50 text-sky-600 border-sky-100'
                            : 'bg-teal-50 text-teal-600 border-teal-100'
                        }`}
                      >
                        {file.type.toUpperCase().slice(0, 4)}
                      </div>
                      <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-500 shrink-0">v{file.versions}.0</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-[15px] mb-2 leading-snug line-clamp-2 min-h-[44px] group-hover:text-indigo-600 transition-colors">{file.name}</h4>

                    <div className="flex justify-between items-center text-xs text-slate-500 mb-2 gap-2">
                      <span className="font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{file.size}</span>
                      <span className="truncate">{file.uploadedBy.split(' ')[0]}</span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 mb-5">
                      Status: <span className="text-indigo-600">{file.status}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                      <span className="text-[11px] font-medium text-slate-400 block">{file.date}</span>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="text-slate-700 hover:text-slate-900 font-semibold text-xs px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(file.id);
                          }}
                          disabled={!file.canDownload}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-1.5 rounded-lg bg-rose-50/60 hover:bg-rose-50 transition-colors border border-rose-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                          }}
                        >
                          Delete
                        </button>
                        <Link
                          to={`/student/projects/${id}/files/${encodeURIComponent(file.name)}/history`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs px-2 py-1.5 rounded-lg bg-indigo-50/60 hover:bg-indigo-50 transition-colors border border-indigo-100 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          History
                        </Link>
                        <Link
                          to={`/student/projects/${id}/files/${encodeURIComponent(file.name)}/comments`}
                          className="text-teal-600 hover:text-teal-800 font-semibold text-xs px-2 py-1.5 rounded-lg bg-teal-50/60 hover:bg-teal-50 transition-colors border border-teal-100 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Comments
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h3 className="text-[17px] font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Document Activity
          </h3>

          <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
            {activityItems.length === 0 ? (
              <div className="relative text-sm text-slate-500">No activity yet.</div>
            ) : (
              activityItems.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4 group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-teal-100 text-teal-600 shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/50 transition-colors min-w-0">
                    <time className="text-[11px] font-semibold text-indigo-600 mb-1 block">{item.date}</time>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1 break-words">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.uploadedBy} uploaded a new revision.</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Document Name</label>
                <input
                  value={form.documentName}
                  onChange={(e) => setForm((prev) => ({ ...prev, documentName: e.target.value }))}
                  placeholder="e.g. API_Documentation.docx"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Select File</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setForm((prev) => ({ ...prev, file: selected, documentName: prev.documentName || selected?.name || '' }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="mt-1 text-xs text-slate-500">Allowed: any project-related file (SQL, PDF, DOCX, ZIP, etc.).</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Branch</label>
                <input
                  value={form.branch}
                  onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
                  placeholder="main"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="What changed in this upload?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCreateDocument}
                disabled={uploading || !form.file}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
