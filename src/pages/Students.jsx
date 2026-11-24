import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  FilterX,
  ArrowUpDown,
  FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../services/studentService';
import { getAllSchoolsDropdown, getSchoolFilterOptions } from '../services/schoolService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/csvHelper';
import { STANDARDS_LIST, MEDIUMS_LIST } from '../utils/validators';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentFormModal from '../components/students/StudentFormModal';
import StudentViewModal from '../components/students/StudentViewModal';

export default function Students() {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [schoolsDropdown, setSchoolsDropdown] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  // Filters & Sorting
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(search, 350);
  const [schoolId, setSchoolId] = useState('');
  const [standard, setStandard] = useState('');
  const [medium, setMedium] = useState('');
  const [district, setDistrict] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([getAllSchoolsDropdown(), getSchoolFilterOptions()])
      .then(([schoolsData, filterOpts]) => {
        setSchoolsDropdown(schoolsData);
        setDistrictsList(filterOpts.districts);
      })
      .catch(console.error);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await getStudents({
        search: debouncedSearch,
        schoolId,
        standard,
        medium,
        district,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });
      setStudents(data);
      setTotalCount(count);
    } catch (err) {
      toast.error(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, schoolId, standard, medium, district, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSaveStudent = async (payload, signatureFile) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, payload, signatureFile);
      toast.success('Student record updated.');
    } else {
      await createStudent(payload, signatureFile, user?.id);
      toast.success('Student registered successfully.');
    }
    setEditingStudent(null);
    await fetchStudents();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      toast.success('Student deleted.');
      setDeleteTarget(null);
      await fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete student.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const { data } = await getStudents({
        search: debouncedSearch,
        schoolId,
        standard,
        medium,
        district,
        sortBy,
        sortOrder,
        page: 1,
        pageSize: 10000,
      });
      exportToCsv('students_export.csv', data, [
        { key: 'form_number', header: 'Form Number' },
        { key: 'student_name', header: 'Student Name' },
        { key: 'first_name', header: 'First Name' },
        { key: 'father_name', header: "Father's Name" },
        { key: 'student_surname', header: 'Surname' },
        { key: 'parent_mobile', header: 'Parent Mobile' },
        { key: 'school_name', header: 'School Name' },
        { key: 'standard', header: 'Standard' },
        { key: 'medium', header: 'Medium' },
        { key: 'gender', header: 'Gender' },
        { key: 'date_of_birth', header: 'Date of Birth' },
        { key: 'student_address', header: 'Address' },
      ]);
      toast.success(`Exported ${data.length} student records.`);
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSchoolId('');
    setStandard('');
    setMedium('');
    setDistrict('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Information Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Register students, attach parent signatures, prevent duplicate entries, and filter profiles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleExportCsv} className="btn-secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Register Student
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
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
              placeholder="Search student, surname, school, mobile..."
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
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Districts</option>
            {districtsList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Sort & Reset */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
            >
              <option value="created_at">Recently Registered</option>
              <option value="student_name">Student Name (A-Z)</option>
              <option value="student_surname">Surname (A-Z)</option>
              <option value="school_name">School-wise</option>
              <option value="standard">Standard-wise</option>
              <option value="form_number">Form Number</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {(search || schoolId || standard || medium || district) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading student records..." />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Register a new student or broaden your search and filter criteria."
          action={
            <button onClick={() => setFormOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Register First Student
            </button>
          }
        />
      ) : (
        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Form No.</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Parent Mobile</th>
                  <th className="px-4 py-3">School & District</th>
                  <th className="px-4 py-3">Std / Medium</th>
                  <th className="px-4 py-3">Signature</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                      {st.form_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{st.student_name}</p>
                      <p className="text-xs text-slate-500">
                        {st.gender || 'N/A'} {st.date_of_birth ? `• DOB: ${st.date_of_birth}` : ''}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {st.parent_mobile}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{st.school_name}</p>
                      <p className="text-xs text-slate-400">{st.schools?.district || '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        {st.standard} • {st.medium}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {st.parent_signature_url ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <FileCheck className="h-3.5 w-3.5" />
                          Attached
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewingStudent(st)}
                          title="View Complete Profile"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(st);
                            setFormOpen(true);
                          }}
                          title="Edit Student"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(st)}
                            title="Delete Student"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Modals */}
      <StudentFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        schools={schoolsDropdown}
        initialData={editingStudent}
      />

      <StudentViewModal
        student={viewingStudent}
        onClose={() => setViewingStudent(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Student Record"
        message={`Are you sure you want to delete "${deleteTarget?.student_name}" (${deleteTarget?.form_number})? Associated examination records will also be removed.`}
      />
    </div>
  );
}