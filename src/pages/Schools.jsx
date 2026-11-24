import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  FilterX,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSchools,
  getSchoolFilterOptions,
  createSchool,
  updateSchool,
  deleteSchool,
} from '../services/schoolService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCsv } from '../utils/csvHelper';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SchoolFormModal from '../components/schools/SchoolFormModal';
import SchoolViewModal from '../components/schools/SchoolViewModal';

export default function Schools() {
  const { user, isAdmin } = useAuth();
  const [schools, setSchools] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [standard, setStandard] = useState('');
  const [medium, setMedium] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filterOptions, setFilterOptions] = useState({
    districts: [],
    talukas: [],
    standards: [],
    mediums: [],
  });

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [viewingSchool, setViewingSchool] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadFilterOptions = async () => {
    try {
      const opts = await getSchoolFilterOptions();
      setFilterOptions(opts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await getSchools({
        search: debouncedSearch,
        district,
        taluka,
        standard,
        medium,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });
      setSchools(data);
      setTotalCount(count);
    } catch (err) {
      toast.error(err.message || 'Failed to load schools.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, district, taluka, standard, medium, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleSaveSchool = async (payload) => {
    if (editingSchool) {
      await updateSchool(editingSchool.id, payload);
      toast.success('School updated successfully.');
    } else {
      await createSchool(payload, user?.id);
      toast.success('School registered successfully.');
    }
    setEditingSchool(null);
    await Promise.all([fetchSchools(), loadFilterOptions()]);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSchool(deleteTarget.id);
      toast.success('School deleted successfully.');
      setDeleteTarget(null);
      await Promise.all([fetchSchools(), loadFilterOptions()]);
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const { data } = await getSchools({
        search: debouncedSearch,
        district,
        taluka,
        standard,
        medium,
        sortBy,
        sortOrder,
        page: 1,
        pageSize: 10000,
      });
      exportToCsv('schools_export.csv', data, [
        { key: 'form_number', header: 'Form Number' },
        { key: 'school_name', header: 'School Name' },
        { key: 'school_address', header: 'School Address' },
        { key: 'at_post', header: 'At Post' },
        { key: 'taluka', header: 'Taluka' },
        { key: 'district', header: 'District' },
        { key: 'pin_code', header: 'PIN Code' },
        { key: 'standard', header: 'Standard' },
        { key: 'medium', header: 'Medium' },
        { key: 'school_phone', header: 'School Phone' },
        { key: 'guidance_teacher_name', header: 'Guidance Teacher' },
        { key: 'teacher_mobile', header: 'Teacher Mobile' },
        { key: 'school_email', header: 'School Email' },
      ]);
      toast.success(`Exported ${data.length} school records.`);
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDistrict('');
    setTaluka('');
    setStandard('');
    setMedium('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Information Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage registered schools, guidance teachers, locations, and academic standards
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleExportCsv} className="btn-secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingSchool(null);
              setFormOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add New School
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
              placeholder="Search form no, school, teacher, mobile..."
              className="input-field pl-9"
            />
          </div>

          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Districts</option>
            {filterOptions.districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={taluka}
            onChange={(e) => {
              setTaluka(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Talukas</option>
            {filterOptions.talukas.map((t) => (
              <option key={t} value={t}>{t}</option>
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
            {filterOptions.standards.map((s) => (
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
            {filterOptions.mediums.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Sort & Clear Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
            >
              <option value="created_at">Recently Added</option>
              <option value="school_name">School Name (A-Z)</option>
              <option value="form_number">Form Number</option>
              <option value="district">District</option>
              <option value="standard">Standard</option>
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

          {(search || district || taluka || standard || medium) && (
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

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner text="Loading school directory..." />
      ) : schools.length === 0 ? (
        <EmptyState
          title="No schools found"
          description="Register a new school or adjust your search/filter parameters."
          action={
            <button onClick={() => setFormOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add First School
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
                  <th className="px-4 py-3">School Name</th>
                  <th className="px-4 py-3">Location (Taluka / Dist)</th>
                  <th className="px-4 py-3">Std / Medium</th>
                  <th className="px-4 py-3">Guidance Teacher</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {schools.map((sc) => (
                  <tr key={sc.id} className="hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                      {sc.form_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{sc.school_name}</p>
                      <p className="text-xs text-slate-500">{sc.school_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{sc.taluka}, {sc.district}</p>
                      <p className="text-xs text-slate-400">PIN: {sc.pin_code}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {sc.standard} • {sc.medium}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{sc.guidance_teacher_name}</p>
                      <p className="text-xs text-slate-500">{sc.teacher_mobile}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewingSchool(sc)}
                          title="View Details"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSchool(sc);
                            setFormOpen(true);
                          }}
                          title="Edit School"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(sc)}
                            title="Delete School"
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
      <SchoolFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingSchool(null);
        }}
        onSave={handleSaveSchool}
        initialData={editingSchool}
      />

      <SchoolViewModal
        school={viewingSchool}
        onClose={() => setViewingSchool(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete School Record"
        message={`Are you sure you want to delete "${deleteTarget?.school_name}" (${deleteTarget?.form_number})?`}
      />
    </div>
  );
}