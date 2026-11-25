import React, { useEffect, useState } from 'react';
import { X, Save, UserPlus, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  STANDARDS_LIST,
  MEDIUMS_LIST,
  ACADEMIC_YEARS_LIST,
  isValidIndianMobile,
} from '../../utils/validators';

const initialForm = {
  form_number: '',
  student_surname: '',
  first_name: '',
  father_name: '',
  student_name: '',
  parent_mobile: '',
  parent_signature_url: '',
  school_id: '',
  school_name: '',
  standard: '4th',
  medium: 'Marathi',
  academic_year: '2026-27',
  counselor_name: '',
  exam_center: '',
  date_of_birth: '',
  gender: 'Male',
  student_address: '',
};

export default function StudentFormModal({
  isOpen,
  onClose,
  onSave,
  schools = [],
  initialData = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [signatureFile, setSignatureFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        form_number: initialData.form_number || '',
        student_surname: initialData.student_surname || '',
        first_name: initialData.first_name || '',
        father_name: initialData.father_name || '',
        student_name: initialData.student_name || '',
        parent_mobile: initialData.parent_mobile || '',
        parent_signature_url: initialData.parent_signature_url || '',
        school_id: initialData.school_id || '',
        school_name: initialData.school_name || '',
        standard: initialData.standard || '4th',
        medium: initialData.medium || 'Marathi',
        academic_year: initialData.academic_year || '2026-27',
        counselor_name: initialData.counselor_name || '',
        exam_center: initialData.exam_center || '',
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender || 'Male',
        student_address: initialData.student_address || '',
      });
    } else {
      setForm(initialForm);
    }
    setSignatureFile(null);
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNamePartChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const composed = [updated.first_name, updated.father_name, updated.student_surname]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ');
      updated.student_name = composed;
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSchoolSelect = (schoolId) => {
    const selected = schools.find((s) => s.id === schoolId);
    setForm((prev) => ({
      ...prev,
      school_id: schoolId,
      school_name: selected ? selected.school_name : '',
      medium: selected?.medium || prev.medium,
    }));
    if (errors.school_id) setErrors((prev) => ({ ...prev, school_id: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.father_name.trim()) errs.father_name = "Father's name is required.";
    if (!form.student_surname.trim()) errs.student_surname = 'Surname is required.';
    if (!form.student_name.trim()) errs.student_name = 'Full student name is required.';
    // Parent mobile is NOT mandatory (required = false)
    if (!isValidIndianMobile(form.parent_mobile, false)) {
      errs.parent_mobile = 'If entered, mobile must be 10 digits.';
    }
    if (!form.school_id) errs.school_id = 'Please select a registered school.';
    if (!form.standard) errs.standard = 'Standard is required.';
    if (!form.medium) errs.medium = 'Medium is required.';
    if (!form.academic_year) errs.academic_year = 'Academic year is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        student_name: form.student_name.trim(),
        student_surname: form.student_surname.trim(),
        first_name: form.first_name.trim(),
        father_name: form.father_name.trim(),
        parent_mobile: form.parent_mobile.trim() || null,
        parent_signature_url: form.parent_signature_url || null,
        school_id: form.school_id,
        school_name: form.school_name,
        standard: form.standard,
        medium: form.medium,
        academic_year: form.academic_year,
        counselor_name: form.counselor_name.trim() || null,
        exam_center: form.exam_center.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        student_address: form.student_address.trim() || null,
      };
      await onSave(payload, signatureFile);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-blue-300" />
            <h2 className="text-lg font-bold">
              {initialData ? 'Edit Student Record' : 'Register New Student'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-blue-200 hover:bg-blue-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label-text">Form / Exam No.</label>
              <input
                type="text"
                disabled
                value={initialData ? form.form_number : 'Auto-Generated (STU-XXXXX)'}
                className="input-field font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label-text">Select School *</label>
              <select
                value={form.school_id}
                onChange={(e) => handleSchoolSelect(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose Registered School --</option>
                {schools.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.school_name} ({sc.form_number} • {sc.district})
                  </option>
                ))}
              </select>
              {errors.school_id && <p className="mt-1 text-xs text-red-600">{errors.school_id}</p>}
            </div>

            <div>
              <label className="label-text">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => handleNamePartChange('first_name', e.target.value)}
                placeholder="e.g., Aarav"
                className="input-field"
              />
              {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
            </div>

            <div>
              <label className="label-text">Father&apos;s Name *</label>
              <input
                type="text"
                value={form.father_name}
                onChange={(e) => handleNamePartChange('father_name', e.target.value)}
                placeholder="e.g., Suresh"
                className="input-field"
              />
              {errors.father_name && <p className="mt-1 text-xs text-red-600">{errors.father_name}</p>}
            </div>

            <div>
              <label className="label-text">Student Surname *</label>
              <input
                type="text"
                value={form.student_surname}
                onChange={(e) => handleNamePartChange('student_surname', e.target.value)}
                placeholder="e.g., Jadhav"
                className="input-field"
              />
              {errors.student_surname && <p className="mt-1 text-xs text-red-600">{errors.student_surname}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="label-text">Full Student Name *</label>
              <input
                type="text"
                value={form.student_name}
                onChange={(e) => setForm((prev) => ({ ...prev, student_name: e.target.value }))}
                placeholder="First Name + Father's Name + Surname"
                className="input-field bg-blue-50/40 font-medium"
              />
              {errors.student_name && <p className="mt-1 text-xs text-red-600">{errors.student_name}</p>}
            </div>

            <div>
              <label className="label-text">Parent Mobile (Optional)</label>
              <input
                type="text"
                maxLength={10}
                value={form.parent_mobile}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    parent_mobile: e.target.value.replace(/\D/g, ''),
                  }))
                }
                placeholder="Optional 10-digit mobile"
                className="input-field"
              />
              {errors.parent_mobile && <p className="mt-1 text-xs text-red-600">{errors.parent_mobile}</p>}
            </div>

            <div>
              <label className="label-text">Standard *</label>
              <select
                value={form.standard}
                onChange={(e) => setForm((prev) => ({ ...prev, standard: e.target.value }))}
                className="input-field"
              >
                {STANDARDS_LIST.map((std) => (
                  <option key={std} value={std}>{std}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Medium *</label>
              <select
                value={form.medium}
                onChange={(e) => setForm((prev) => ({ ...prev, medium: e.target.value }))}
                className="input-field"
              >
                {MEDIUMS_LIST.map((med) => (
                  <option key={med} value={med}>{med}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Academic Year *</label>
              <select
                value={form.academic_year}
                onChange={(e) => setForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                className="input-field"
              >
                {ACADEMIC_YEARS_LIST.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Counselor Name</label>
              <input
                type="text"
                value={form.counselor_name}
                onChange={(e) => setForm((prev) => ({ ...prev, counselor_name: e.target.value }))}
                placeholder="Enter counselor name"
                className="input-field"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label-text">Exam Center Name</label>
              <input
                type="text"
                value={form.exam_center}
                onChange={(e) => setForm((prev) => ({ ...prev, exam_center: e.target.value }))}
                placeholder="e.g., D. A. Magdum High School, Kolhapur"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Gender (Optional)</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="label-text">Date of Birth (Optional)</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Parent Signature (Optional)</label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-blue-500">
                <span className="flex items-center gap-1.5 truncate">
                  <UploadCloud className="h-4 w-4 shrink-0 text-blue-600" />
                  {signatureFile
                    ? signatureFile.name
                    : form.parent_signature_url
                    ? 'Signature attached'
                    : 'Upload JPG/PNG/PDF'}
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden"
                  onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label-text">Student Address (Optional)</label>
              <input
                type="text"
                value={form.student_address}
                onChange={(e) => setForm((prev) => ({ ...prev, student_address: e.target.value }))}
                placeholder="Residential address"
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Saving Student...' : initialData ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}