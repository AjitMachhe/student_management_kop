import React, { useEffect, useState } from 'react';
import { Award, Plus, Edit2, Trash2, Save, X, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getResultOptions,
  createResultOption,
  updateResultOption,
  deleteResultOption,
} from '../services/resultOptionService';
import { useAuth } from '../context/AuthContext';
import { BADGE_COLOR_CLASSES } from '../utils/gradeCalculator';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

const COLOR_CHOICES = Object.keys(BADGE_COLOR_CLASSES);

const blankOption = {
  option_code: '',
  option_label: '',
  min_percentage: 0,
  max_percentage: 100,
  is_passing: true,
  badge_color: 'blue',
  display_order: 1,
  is_active: true,
  description: '',
};

export default function ResultOptions() {
  const { isAdmin } = useAuth();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingItem, setEditingItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankOption);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const data = await getResultOptions();
      setOptions(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load result options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({ ...blankOption, display_order: options.length + 1 });
    setFormOpen(true);
  };

  const openEditModal = (opt) => {
    setEditingItem(opt);
    setForm({
      option_code: opt.option_code,
      option_label: opt.option_label,
      min_percentage: opt.min_percentage,
      max_percentage: opt.max_percentage,
      is_passing: opt.is_passing,
      badge_color: opt.badge_color || 'blue',
      display_order: opt.display_order,
      is_active: opt.is_active,
      description: opt.description || '',
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.option_code.trim() || !form.option_label.trim()) {
      toast.error('Option code and label are required.');
      return;
    }
    if (Number(form.min_percentage) > Number(form.max_percentage)) {
      toast.error('Minimum percentage cannot exceed maximum percentage.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        option_code: form.option_code.trim().toUpperCase().replace(/\s+/g, '_'),
        option_label: form.option_label.trim(),
        min_percentage: Number(form.min_percentage),
        max_percentage: Number(form.max_percentage),
        display_order: Number(form.display_order),
      };

      if (editingItem) {
        await updateResultOption(editingItem.id, payload);
        toast.success('Result option updated.');
      } else {
        await createResultOption(payload);
        toast.success('Result option added.');
      }
      setFormOpen(false);
      await loadOptions();
    } catch (err) {
      toast.error(err.message || 'Failed to save option.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResultOption(deleteTarget.id);
      toast.success('Result option deleted.');
      setDeleteTarget(null);
      await loadOptions();
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading 12 result configurations..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Result Options Configuration ({options.length} / 12)
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Configure the 12 grading brackets, percentage thresholds, pass/fail status, and badge colors
          </p>
        </div>

        {isAdmin && options.length < 12 && (
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Result Option
          </button>
        )}
      </div>

      <div className="card-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Result Label (Badge)</th>
                <th className="px-4 py-3">Percentage Range</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {options.map((opt) => (
                <tr key={opt.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-semibold text-slate-600">#{opt.display_order}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{opt.option_code}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        BADGE_COLOR_CLASSES[opt.badge_color] || BADGE_COLOR_CLASSES.blue
                      }`}
                    >
                      {opt.option_label}
                    </span>
                    {opt.description && (
                      <p className="mt-1 text-xs text-slate-400">{opt.description}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                    {opt.min_percentage}% — {opt.max_percentage}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {opt.is_passing ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Passing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <XCircle className="h-4 w-4" />
                        Non-Passing
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        opt.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {opt.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(opt)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(opt)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Result Option Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-300" />
                <h2 className="text-lg font-bold">
                  {editingItem ? 'Edit Result Choice' : 'Add Result Choice'}
                </h2>
              </div>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-1 text-blue-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text">Option Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    value={form.option_code}
                    onChange={(e) => setForm({ ...form, option_code: e.target.value })}
                    placeholder="e.g., DISTINCTION"
                    className="input-field font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="label-text">Display Order *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label-text">Result Display Label *</label>
                  <input
                    type="text"
                    required
                    value={form.option_label}
                    onChange={(e) => setForm({ ...form, option_label: e.target.value })}
                    placeholder="e.g., First Class with Distinction"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-text">Min Percentage (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    required
                    value={form.min_percentage}
                    onChange={(e) => setForm({ ...form, min_percentage: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-text">Max Percentage (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    required
                    value={form.max_percentage}
                    onChange={(e) => setForm({ ...form, max_percentage: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-text">Badge Color</label>
                  <select
                    value={form.badge_color}
                    onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                    className="input-field capitalize"
                  >
                    {COLOR_CHOICES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-center gap-2 pt-4">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_passing}
                      onChange={(e) => setForm({ ...form, is_passing: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Counts as Passing
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Active in Grading
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="label-text">Description (Optional)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Criteria description..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Result Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Result Option"
        message={`Delete "${deleteTarget?.option_label}"? You currently have ${options.length} of 12 slots configured.`}
      />
    </div>
  );
}