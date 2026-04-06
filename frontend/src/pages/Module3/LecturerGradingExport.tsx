import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Loader2, ClipboardList, CheckCircle2, Search, Filter } from 'lucide-react';
import { useModule } from '../../context/ModuleContext';

type ExportTab = 'assignments' | 'weekly';

type AssignmentSubmission = {
  id: string;
  student?: {
    id: string;
    name: string;
    indexNumber: string | null;
  };
  submittedAt: string;
  late: boolean;
  aiScore: number | null;
  plagiarismScore: number | null;
  riskCategory: string | null;
  checkStatus: string;
  fileName: string;
  submissionMessage: string | null;
};

type AssignmentItem = {
  id: string;
  title: string;
  moduleCode: string;
  moduleName: string | null;
  deadline: string;
  assignmentSubmissions: AssignmentSubmission[];
};

type AssignmentResponse = {
  success: boolean;
  assignments?: AssignmentItem[];
};

type ProjectItem = {
  id: string;
  title: string;
  description?: string;
  status?: string;
};

type ProjectListResponse = {
  success: boolean;
  projects?: ProjectItem[];
};

type WeeklyReport = {
  id: string;
  weekNumber: number;
  status: string;
  feedback: string | null;
  grade: string | null;
  createdAt: string;
  userName: string;
  userIndexNumber: string | null;
  role: string;
  completed: string;
  challenges: string;
  plan: string;
};

type WeeklyReportResponse = {
  success: boolean;
  reports?: WeeklyReport[];
};

type AssignmentExportRow = {
  moduleCode: string;
  assignmentTitle: string;
  studentName: string;
  indexNumber: string;
  submittedAt: string;
  late: string;
  aiScore: string;
  plagiarismScore: string;
  riskCategory: string;
  checkStatus: string;
  fileName: string;
  submissionMessage: string;
};

type WeeklyExportRow = {
  moduleCode: string;
  projectName: string;
  week: string;
  studentName: string;
  indexNumber: string;
  teamRole: string;
  status: string;
  grade: string;
  feedback: string;
  submittedAt: string;
};

const API_BASE = 'http://localhost:5000/api';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv<T extends Record<string, string>>(rows: T[], headers: Array<keyof T>): string {
  const headerLine = headers.join(',');
  const lines = rows.map((row) => headers.map((h) => escapeCsv(row[h] ?? '')).join(','));
  return [headerLine, ...lines].join('\n');
}

function downloadTextFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseModuleCode(description?: string): string {
  if (!description) return 'UNASSIGNED';
  const match = description.match(/\[(.*?)\]/);
  return match?.[1] || 'UNASSIGNED';
}

export default function LecturerGradingExport() {
  const { selectedModule } = useModule();
  const [activeTab, setActiveTab] = useState<ExportTab>('assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [reviewedOnly, setReviewedOnly] = useState(true);

  const [assignmentRows, setAssignmentRows] = useState<AssignmentExportRow[]>([]);
  const [weeklyRows, setWeeklyRows] = useState<WeeklyExportRow[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');

      try {
        const stored = sessionStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        const user = parsed?.user || parsed;

        const lecturerAssignmentUrl = user?.id
          ? `${API_BASE}/assignment/lecturer?createdById=${user.id}`
          : `${API_BASE}/assignment/lecturer`;

        const [assignmentRes, projectRes] = await Promise.all([
          fetch(lecturerAssignmentUrl),
          fetch(`${API_BASE}/project/list`)
        ]);

        if (!assignmentRes.ok || !projectRes.ok) {
          throw new Error('Failed to load export data from API.');
        }

        const assignmentData = (await assignmentRes.json()) as AssignmentResponse;
        const projectData = (await projectRes.json()) as ProjectListResponse;

        const assignments = assignmentData.assignments ?? [];
        const nextAssignmentRows: AssignmentExportRow[] = [];

        assignments.forEach((assignment) => {
          const moduleCode = assignment.moduleCode || 'UNASSIGNED';
          assignment.assignmentSubmissions.forEach((submission) => {
            nextAssignmentRows.push({
              moduleCode,
              assignmentTitle: assignment.title,
              studentName: submission.student?.name || 'Unknown Student',
              indexNumber: submission.student?.indexNumber || '',
              submittedAt: new Date(submission.submittedAt).toLocaleString(),
              late: submission.late ? 'Yes' : 'No',
              aiScore: submission.aiScore == null ? '' : String(Math.round(submission.aiScore)),
              plagiarismScore: submission.plagiarismScore == null ? '' : String(Math.round(submission.plagiarismScore)),
              riskCategory: submission.riskCategory || '',
              checkStatus: submission.checkStatus || '',
              fileName: submission.fileName || '',
              submissionMessage: submission.submissionMessage || ''
            });
          });
        });

        const projects = (projectData.projects ?? []).filter((p) => p.status !== 'Archived');
        const reportRequests = projects.map(async (project) => {
          try {
            const resp = await fetch(`${API_BASE}/report/list/${project.id}`);
            if (!resp.ok) return [] as WeeklyExportRow[];

            const data = (await resp.json()) as WeeklyReportResponse;
            const reports = data.reports ?? [];
            const moduleCode = parseModuleCode(project.description);

            return reports.map((report) => ({
              moduleCode,
              projectName: project.title,
              week: `Week ${report.weekNumber}`,
              studentName: report.userName || 'Unknown Student',
              indexNumber: report.userIndexNumber || '',
              teamRole: report.role || 'Member',
              status: report.status || '',
              grade: report.grade || '',
              feedback: report.feedback || '',
              submittedAt: new Date(report.createdAt).toLocaleString()
            }));
          } catch {
            return [] as WeeklyExportRow[];
          }
        });

        const reportRows = await Promise.all(reportRequests);

        setAssignmentRows(nextAssignmentRows);
        setWeeklyRows(reportRows.flat());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load export data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignmentRows.filter((row) => {
      const moduleOk = selectedModule === 'ALL' || row.moduleCode === selectedModule;
      if (!moduleOk) return false;

      const q = query.trim().toLowerCase();
      if (!q) return true;

      return (
        row.assignmentTitle.toLowerCase().includes(q) ||
        row.studentName.toLowerCase().includes(q) ||
        row.indexNumber.toLowerCase().includes(q) ||
        row.moduleCode.toLowerCase().includes(q)
      );
    });
  }, [assignmentRows, selectedModule, query]);

  const filteredWeekly = useMemo(() => {
    return weeklyRows.filter((row) => {
      const moduleOk = selectedModule === 'ALL' || row.moduleCode === selectedModule;
      if (!moduleOk) return false;

      if (reviewedOnly && row.status.toLowerCase() !== 'reviewed') {
        return false;
      }

      const q = query.trim().toLowerCase();
      if (!q) return true;

      return (
        row.projectName.toLowerCase().includes(q) ||
        row.studentName.toLowerCase().includes(q) ||
        row.indexNumber.toLowerCase().includes(q) ||
        row.grade.toLowerCase().includes(q) ||
        row.moduleCode.toLowerCase().includes(q)
      );
    });
  }, [weeklyRows, selectedModule, reviewedOnly, query]);

  const currentRows = activeTab === 'assignments' ? filteredAssignments : filteredWeekly;

  const onExportCsv = (): void => {
    if (currentRows.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (activeTab === 'assignments') {
      const headers: Array<keyof AssignmentExportRow> = [
        'moduleCode',
        'assignmentTitle',
        'studentName',
        'indexNumber',
        'submittedAt',
        'late',
        'aiScore',
        'plagiarismScore',
        'riskCategory',
        'checkStatus',
        'fileName',
        'submissionMessage'
      ];
      const csv = toCsv(filteredAssignments, headers);
      downloadTextFile(csv, `verity-assignment-export-${timestamp}.csv`, 'text/csv;charset=utf-8;');
      return;
    }

    const headers: Array<keyof WeeklyExportRow> = [
      'moduleCode',
      'projectName',
      'week',
      'studentName',
      'indexNumber',
      'teamRole',
      'status',
      'grade',
      'feedback',
      'submittedAt'
    ];
    const csv = toCsv(filteredWeekly, headers);
    downloadTextFile(csv, `verity-weekly-grades-export-${timestamp}.csv`, 'text/csv;charset=utf-8;');
  };

  const onExportJson = (): void => {
    if (currentRows.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const payload = JSON.stringify(currentRows, null, 2);
    const fileName = activeTab === 'assignments'
      ? `verity-assignment-export-${timestamp}.json`
      : `verity-weekly-grades-export-${timestamp}.json`;

    downloadTextFile(payload, fileName, 'application/json;charset=utf-8;');
  };

  const reviewedCount = weeklyRows.filter((row) => row.status.toLowerCase() === 'reviewed').length;

  return (
    <div className="animate-fade-up space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 shadow-lg shadow-slate-200/50 md:p-8">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-teal-300/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-sage">Lecturer Analytics</span>
              <span className="badge badge-slate">Grade Intelligence Export</span>
            </div>
            <h1 className="page-title text-slate-900">Grading Export Center</h1>
            <p className="page-subtitle max-w-3xl text-slate-600">
              Export assignment submissions and weekly grading records in one place. Use module filters and reviewed-only mode to generate clean handover-ready datasets.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment Rows</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{assignmentRows.length}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Weekly Rows</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{weeklyRows.length}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Reviewed Reports</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{reviewedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 md:p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === 'assignments' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Assignment Results
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weekly')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === 'weekly' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Weekly Grades
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student, project, assignment, or IT number"
                className="glass-input w-full pl-10 sm:w-[22rem]"
              />
            </div>

            {activeTab === 'weekly' && (
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                <Filter className="h-3.5 w-3.5 text-emerald-600" />
                <input
                  type="checkbox"
                  checked={reviewedOnly}
                  onChange={(e) => setReviewedOnly(e.target.checked)}
                  className="accent-emerald-600"
                />
                Reviewed only
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={currentRows.length === 0 || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={onExportJson}
            disabled={currentRows.length === 0 || loading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : currentRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-lg font-black text-slate-700">No rows available for this filter.</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Try changing the module, search query, or reviewed-only toggle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                {activeTab === 'assignments' ? (
                  <tr>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Module</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Assignment</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Student</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">IT Number</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">AI</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Plagiarism</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Module</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Project</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Week</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Student</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">IT Number</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Grade</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500">Status</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {activeTab === 'assignments'
                  ? filteredAssignments.slice(0, 120).map((row) => (
                      <tr key={`${row.assignmentTitle}-${row.studentName}-${row.submittedAt}`}>
                        <td className="px-4 py-3 font-semibold text-slate-700">{row.moduleCode}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{row.assignmentTitle}</td>
                        <td className="px-4 py-3 text-slate-700">{row.studentName}</td>
                        <td className="px-4 py-3 text-slate-500">{row.indexNumber || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{row.aiScore || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{row.plagiarismScore || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="badge badge-slate">{row.checkStatus || 'Pending'}</span>
                        </td>
                      </tr>
                    ))
                  : filteredWeekly.slice(0, 120).map((row) => (
                      <tr key={`${row.projectName}-${row.studentName}-${row.week}-${row.submittedAt}`}>
                        <td className="px-4 py-3 font-semibold text-slate-700">{row.moduleCode}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{row.projectName}</td>
                        <td className="px-4 py-3 text-slate-700">{row.week}</td>
                        <td className="px-4 py-3 text-slate-700">{row.studentName}</td>
                        <td className="px-4 py-3 text-slate-500">{row.indexNumber || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{row.grade || '-'}</td>
                        <td className="px-4 py-3">
                          {row.status.toLowerCase() === 'reviewed' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed
                            </span>
                          ) : (
                            <span className="badge badge-amber">{row.status || 'Pending'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
