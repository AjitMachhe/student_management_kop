import React, { useEffect, useState } from 'react';
import { X, Save, School } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  STANDARDS_LIST,
  MEDIUMS_LIST,
  isValidIndianMobile,
  isValidSchoolPhone,
  isValidPinCode,
  isValidEmail,
} from '../../utils/validators';

const initialForm = {
  form_number: '',
  school_name: '',
  school_address: '',
  at_post: '',
  taluka: '',
  district: '',
  pin_code: '',
  standard: '10th',
  medium: 'Marathi',
  school_phone: '',
  guidance_teacher_name: '',
  teacher_mobile: '',
  school_email: '',
};

export default function SchoolFormModal({ isOpen, onClose, onSave, initialData = null }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        form_number: initialData.form_number || '',
        school_name: initialData.school_name || '',
        school_address: initialData.school_address || '',
        at_post: initialData.at_post || '',
        taluka: initialData.taluka || '',
        district: initialData.district || '',
        pin_code: initialData.pin_code || '',
        standard: initialData.standard || '10th',
        medium: initialData.medium || 'Marathi',
        school_phone: initialData.school_phone || '',
        guidance_teacher_name: initialData.guidance_teacher_name || '',
        teacher_mobile: initialData.teacher_mobile || '',
        school_email: initialData.school_email || '',
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!form.school_name.trim()) errs.school_name = 'School name is required.';
    if (!form.school_address.trim()) errs.school_address = 'School address is required.';
    if (!form.at_post.trim()) errs.at_post = 'At Post is required.';
    if (!form.taluka.trim()) errs.taluka = 'Taluka is required.';
    if (!form.district.trim()) errs.district = 'District is required.';
    if (!isValidPinCode(form.pin_code)) errs.pin_code = 'Enter a valid 6-digit PIN code.';
    if (!form.standard) errs.standard = 'Standard is required.';
    if (!form.medium) errs.medium = 'Medium is required.';
    if (!isValidSchoolPhone(form.school_phone)) {
      errs.school_phone = 'Enter a valid 10-12 digit phone number.';
    }
    if (!form.guidance_teacher_name.trim()) {
      errs.guidance_teacher_name = 'Guidance teacher name is required.';
    }
    if (!isValidIndianMobile(form.teacher_mobile)) {
      errs.teacher_mobile = 'Enter a valid 10-digit mobile number.';
    }
    if (!isValidEmail(form.school_email)) {
      errs.school_email = 'Enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted validation errors.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        school_name: form.school_name.trim(),
        school_address: form.school_address.trim(),
        at_post: form.at_post.trim(),
        taluka: form.taluka.trim(),
        district: form.district.trim(),
        pin_code: form.pin_code.trim(),
        school_phone: form.school_phone.trim(),
        guidance_teacher_name: form.guidance_teacher_name.trim(),
        teacher_mobile: form.teacher_mobile.trim(),
        school_email: form.school_email.trim() || null,
      };
      if (!initialData) {
        delete payload.form_number; // Let PostgreSQL trigger auto-generate SCH-XXXX
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save school.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <School className="h-5 w-5 text-blue-300" />
            <h2 className="text-lg font-bold">
              {initialData ? 'Edit School Information' : 'Register New School'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-blue-200 hover:bg-blue-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label-text">1. Form Number</label>
              <input
                type="text"
                disabled
                value={initialData ? form.form_number : 'Auto-Generated (SCH-XXXX)'}
                className="input-field font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label-text">2. School Name *</label>
              <input
                type="text"
                value={form.school_name}
                onChange={(e) => handleChange('school_name', e.target.value)}
                placeholder="e.g., Shree Chhatrapati Shahu Vidyalaya"
                className="input-field"
              />
              {errors.school_name && <p className="mt-1 text-xs text-red-600">{errors.school_name}</p>}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label-text">3. School Address *</label>
              <input
                type="text"
                value={form.school_address}
                onChange={(e) => handleChange('school_address', e.target.value)}
                placeholder="Street, Landmark, Area"
                className="input-field"
              />
              {errors.school_address && <p className="mt-1 text-xs text-red-600">{errors.school_address}</p>}
            </div>

            <div>
              <label className="label-text">4. At Post *</label>
              <input
                type="text"
                value={form.at_post}
                onChange={(e) => handleChange('at_post', e.target.value)}
                placeholder="Village / Town / City"
                className="input-field"
              />
              {errors.at_post && <p className="mt-1 text-xs text-red-600">{errors.at_post}</p>}
            </div>

            <div>
              <label className="label-text">5. Taluka *</label>
              <input
                type="text"
                value={form.taluka}
                onChange={(e) => handleChange('taluka', e.target.value)}
                placeholder="e.g., Karveer"
                className="input-field"
              />
              {errors.taluka && <p className="mt-1 text-xs text-red-600">{errors.taluka}</p>}
            </div>

            <div>
              <label className="label-text">6. District *</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => handleChange('district', e.target.value)}
                placeholder="e.g., Kolhapur"
                className="input-field"
              />
              {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district}</p>}
            </div>

            <div>
              <label className="label-text">7. PIN Code *</label>
              <input
                type="text"
                maxLength={6}
                value={form.pin_code}
                onChange={(e) => handleChange('pin_code', e.target.value.replace(/\D/g, ''))}
                placeholder="416012"
                className="input-field"
              />
              {errors.pin_code && <p className="mt-1 text-xs text-red-600">{errors.pin_code}</p>}
            </div>

            <div>
              <label className="label-text">8. Standard *</label>
              <select
                value={form.standard}
                onChange={(e) => handleChange('standard', e.target.value)}
                className="input-field"
              >
                {STANDARDS_LIST.map((std) => (
                  <option key={std} value={std}>{std}</option>
                ))}
              </select>
              {errors.standard && <p className="mt-1 text-xs text-red-600">{errors.standard}</p>}
            </div>

            <div>
              <label className="label-text">9. Medium *</label>
              <select
                value={form.medium}
                onChange={(e) => handleChange('medium', e.target.value)}
                className="input-field"
              >
                {MEDIUMS_LIST.map((med) => (
                  <option key={med} value={med}>{med}</option>
                ))}
              </select>
              {errors.medium && <p className="mt-1 text-xs text-red-600">{errors.medium}</p>}
            </div>

            <div>
              <label className="label-text">10. School Phone Number *</label>
              <input
                type="text"
                maxLength={12}
                value={form.school_phone}
                onChange={(e) => handleChange('school_phone', e.target.value)}
                placeholder="02312541122"
                className="input-field"
              />
              {errors.school_phone && <p className="mt-1 text-xs text-red-600">{errors.school_phone}</p>}
            </div>

            <div>
              <label className="label-text">11. Guidance Teacher Name *</label>
              <input
                type="text"
                value={form.guidance_teacher_name}
                onChange={(e) => handleChange('guidance_teacher_name', e.target.value)}
                placeholder="Full Name of Coordinator"
                className="input-field"
              />
              {errors.guidance_teacher_name && (
                <p className="mt-1 text-xs text-red-600">{errors.guidance_teacher_name}</p>
              )}
            </div>

            <div>
              <label className="label-text">12. Teacher Mobile Number *</label>
              <input
                type="text"
                maxLength={10}
                value={form.teacher_mobile}
                onChange={(e) => handleChange('teacher_mobile', e.target.value.replace(/\D/g, ''))}
                placeholder="9822011223"
                className="input-field"
              />
              {errors.teacher_mobile && <p className="mt-1 text-xs text-red-600">{errors.teacher_mobile}</p>}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label-text">13. School Email (Optional)</label>
              <input
                type="email"
                value={form.school_email}
                onChange={(e) => handleChange('school_email', e.target.value)}
                placeholder="school@example.edu.in"
                className="input-field"
              />
              {errors.school_email && <p className="mt-1 text-xs text-red-600">{errors.school_email}</p>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : initialData ? 'Update School' : 'Save School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}