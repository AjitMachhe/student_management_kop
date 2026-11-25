import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Download,
  FileText,
  Award,
  Edit2,
  Trash2,
  FilterX,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getExaminations,
  createExamination,
  updateExamination,
  deleteExamination,
} from '../services/examService';
import { getAllSchoolsDropdown } from '../services/schoolService';
import { getAllStudentsDropdown } from '../services/studentService';
import { getResultOptions } from '../services/resultOptionService';
import { getOrganizationSettings } from '../services/organizationService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/csvHelper';
import { exportTableToPdf } from '../utils/pdfExportHelper';
import { generateCertificatePdf } from '../utils/documentPdfGenerator';
import { BADGE_COLOR_CLASSES } from '../utils/gradeCalculator';
import { STANDARDS_LIST, MEDIUMS_LIST } from '../utils/validators';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ExamFormModal from '../components/examinations/ExamFormModal';

export default function Examinations() {
  const { user, isAdmin } = useAuth();
  const [exams, setExams] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [schoolsDropdown, setSchoolsDropdown] = useState([]);
  const [studentsDropdown, setStudentsDropdown] = useState([]);
  const [resultOptions, setResultOptions] = useState([]);
  const [orgSettings, setOrgSettings] = useState(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [schoolId, setSchoolId] = useState('');
  const [standard, setStandard] = useState('');
  const [medium, setMedium] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllSchoolsDropdown(),
      getAllStudentsDropdown(),
      getResultOptions(),
      getOrganizationSettings(),
    ])
      .then(([scData, stData, roData, orgData]) => {
        setSchoolsDropdown(scData);
        setStudentsDropdown(stData);
        setResultOptions(roData);
        setOrgSettings(orgData);
      })
      .catch(console.error);
  }, []);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await getExaminations({
        search: debouncedSearch,
        schoolId,
        standard,
        medium,
        resultStatus,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });
      setExams(data);
      setTotalCount(count);
    } catch (err) {
      toast.error(err.message || 'Failed to load examination records.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, schoolId, standard, medium, resultStatus, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleSaveExam = async (payload) => {
    if (editingExam) {
      await updateExamination(editingExam.id, payload);
      toast.success('Examination result updated.');
    } else {
      await createExamination(payload, user?.id);
      toast.success('Examination result recorded.');
    }
    setEditingExam(null);
    await fetchExams();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExamination(deleteTarget.id);
      toast.success('Examination record deleted.');
      setDeleteTarget(null);
      await fetchExams();
    } catch (err) {
      toast.error(err.message || 'Failed to delete record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSingleCertificate = async (exam) => {
    try {
      toast.loading('Generating Certificate PDF...', { id: 'cert' });
      await generateCertificatePdf(exam, orgSettings);
      toast.success('Certificate PDF downloaded.', { id: 'cert' });
    } catch (err) {
      toast.error(err.message || 'Failed to generate certificate.', { id: 'cert' });
    }
  };

  const handleBulkCertificates = async () => {
    try {
      toast.loading('Generating Bulk Certificates PDF...', { id: 'bulk-cert' });
      const { data } = await getExaminations({
        search: debouncedSearch,
        schoolId,
        standard,
        medium,
        resultStatus,
        sortBy,
        sortOrder,
        page: 1,
        pageSize: 300,
      });
      await generateCertificatePdf(data, orgSettings);
      toast.success(`Generated ${data.length} Certificates in PDF.`, { id: 'bulk-cert' });
    } catch (err) {
      toast.error(err.message || 'Failed to generate certificates.', { id: 'bulk-cert' });
    }
  };

  const exportCols = [
    { key: 'student_name', header: 'Student Name' },
    { key: 'school_name', header: 'School Name' },
    { key: 'standard', header: 'Std' },
    { key: 'medium', header: 'Medium' },
    { key: 'subject_1_marks', header: 'Sub 1 (Mar/Math)' },
    { key: 'subject_2_marks', header: 'Sub 2 (Eng/IQ)' },
    { key: 'obtained_marks', header: 'Obtained' },
    { key: 'total_marks', header: 'Total' },
    { key: 'percentage', header: '%' },
    { key: 'result_status', header: 'Result Status' },
    { key: 'remarks', header: 'Remarks' },
  ];

  const handleExport = async (format) => {
    try {
      const { data } = await getExaminations({
        search: debouncedSearch,
        schoolId,
        standard,
        medium,
        resultStatus,
        sortBy,
        sortOrder,
        page: 1,
        pageSize: 10000,
      });

      if (format === 'csv') {
        exportToCsv('examination_results.csv', data, exportCols);
        toast.success(`Exported ${data.length} examination records to CSV.`);
      } else {
        exportTableToPdf({
          filename: 'examination_results.pdf',
          title: 'Examination Merit & Result Sheet',
          subtitle: `Total Evaluated: ${data.length}`,
          orgName: orgSettings?.org_name || 'Student Data Management System',
          columns: exportCols,
          rows: data,
        });
        toast.success(`Downloaded PDF with ${data.length} results.`);
      }
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Examination &amp; Result Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            2-Subject marks entry (100/100 up to 3rd Std; 150/100 from 4th Std+) &amp; Certificate PDF printing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleBulkCertificates} className="btn-secondary">
            <Award className="h-4 w-4 text-amber-600" />
            Bulk Certificates PDF
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary">
            <FileText className="h-4 w-4 text-red-600" />
            PDF
          </button>
          <button
            onClick={() => {
              setEditingExam(null);
              setFormOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Exam Marks
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-panel p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search student, school, or result status..."
              className="input-field pl-9"
            />
          </div>

          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Schools</option>
            {schoolsDropdown.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.school_name}</option>
            ))}
          </select>

          <select
            value={standard}
            onChange={(e) => {
              setStandard(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Standards</option>
            {STANDARDS_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={medium}
            onChange={(e) => {
              setMedium(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Mediums</option>
            {MEDIUMS_LIST.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={resultStatus}
            onChange={(e) => {
              setResultStatus(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Result Statuses</option>
            {resultOptions.map((ro) => (
              <option key={ro.id} value={ro.option_label}>{ro.option_label}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
            >
              <option value="created_at">Recently Entered</option>
              <option value="percentage">Percentage-wise</option>
              <option value="obtained_marks">Obtained Marks</option>
              <option value="student_name">Student Name (A-Z)</option>
              <option value="school_name">School-wise</option>
              <option value="standard">Standard-wise</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
            >
              <option value="desc">Descending (High to Low)</option>
              <option value="asc">Ascending (Low to High)</option>
            </select>
          </div>

          {(search || schoolId || standard || medium || resultStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setSchoolId('');
                setStandard('');
                setMedium('');
                setResultStatus('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <LoadingSpinner text="Loading examination results..." />
      ) : exams.length === 0 ? (
        <EmptyState
          title="No examination records found"
          description="Enter subject marks for a registered student or adjust your filters."
          action={
            <button onClick={() => setFormOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add First Result
            </button>
          }
        />
      ) : (
        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Student &amp; School</th>
                  <th className="px-4 py-3">Std / Med</th>
                  <th className="px-4 py-3 text-center">Sub 1 (Mar/Math)</th>
                  <th className="px-4 py-3 text-center">Sub 2 (Eng/IQ)</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">%</th>
                  <th className="px-4 py-3">Result Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {exams.map((ex) => {
                  const badgeColor = ex.result_options?.badge_color || 'blue';
                  const badgeStyle = BADGE_COLOR_CLASSES[badgeColor] || BADGE_COLOR_CLASSES.blue;
                  return (
                    <tr key={ex.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{ex.student_name}</p>
                        <p className="text-xs text-slate-500">{ex.school_name}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-600">
                        {ex.standard} • {ex.medium}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center font-mono text-xs font-semibold text-slate-700">
                        {ex.subject_1_marks} / {ex.subject_1_max_marks || 100}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center font-mono text-xs font-semibold text-slate-700">
                        {ex.subject_2_marks} / {ex.subject_2_max_marks || 100}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">
                        {ex.obtained_marks} / {ex.total_marks}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-blue-700">
                        {ex.percentage}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeStyle}`}
                        >
                          {ex.result_status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleSingleCertificate(ex)}
                            title="Download Certificate PDF"
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                          >
                            <Award className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingExam(ex);
                              setFormOpen(true);
                            }}
                            title="Edit Marks"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTarget(ex)}
                              title="Delete Result"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      <ExamFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExam(null);
        }}
        onSave={handleSaveExam}
        students={studentsDropdown}
        resultOptions={resultOptions}
        initialData={editingExam}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Examination Record"
        message={`Remove examination result for "${deleteTarget?.student_name}" (${deleteTarget?.percentage}%)?`}
      />
    </div>
  );
}