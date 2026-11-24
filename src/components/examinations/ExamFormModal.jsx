import React, { useEffect, useState } from 'react';
import { X, Save, FileSpreadsheet, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateExamResult } from '../../utils/gradeCalculator';

const initialForm = {
  student_id: '',
  student_name: '',
  school_id: '',
  school_name: '',
  standard: '',
  medium: '',
  exam_name: 'Annual Examination',
  max_marks_per_subject: 100,
  subject_1_marks: '',
  subject_2_marks: '',
  subject_3_marks: '',
  subject_4_marks: '',
  subject_5_marks: '',
  total_marks: 500,
  obtained_marks: 0,
  percentage: 0,
  result_option_id: '',
  result_status: '',
  remarks: '',
  manualOverrideStatus: false,
};

export default function ExamFormModal({
  isOpen,
  onClose,
  onSave,
  students = [],
  resultOptions = [],
  initialData = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        student_id: initialData.student_id || '',
        student_name: initialData.student_name || '',
        school_id: initialData.school_id || '',
        school_name: initialData.school_name || '',
        standard: initialData.standard || '',
        medium: initialData.medium || '',
        exam_name: initialData.exam_name || 'Annual Examination',
        max_marks_per_subject: Number(initialData.max_marks_per_subject) || 100,
        subject_1_marks: initialData.subject_1_marks ?? '',
        subject_2_marks: initialData.subject_2_marks ?? '',
        subject_3_marks: initialData.subject_3_marks ?? '',
        subject_4_marks: initialData.subject_4_marks ?? '',
        subject_5_marks: initialData.subject_5_marks ?? '',
        total_marks: Number(initialData.total_marks) || 500,
        obtained_marks: Number(initialData.obtained_marks) || 0,
        percentage: Number(initialData.percentage) || 0,
        result_option_id: initialData.result_option_id || '',
        result_status: initialData.result_status || '',
        remarks: initialData.remarks || '',
        manualOverrideStatus: false,
      });
    } else {
      setForm(initialForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const recalculate = (updatedState) => {
    const calc = calculateExamResult(
      [
        updatedState.subject_1_marks,
        updatedState.subject_2_marks,
        updatedState.subject_3_marks,
        updatedState.subject_4_marks,
        updatedState.subject_5_marks,
      ],
      updatedState.max_marks_per_subject,
      resultOptions
    );

    return {
      ...updatedState,
      total_marks: calc.totalMarks,
      obtained_marks: calc.obtainedMarks,
      percentage: calc.percentage,
      result_option_id: updatedState.manualOverrideStatus
        ? updatedState.result_option_id
        : calc.resultOptionId,
      result_status: updatedState.manualOverrideStatus
        ? updatedState.result_status
        : calc.resultStatus,
    };
  };

  const handleStudentChange = (studentId) => {
    const stu = students.find((s) => s.id === studentId);
    setForm((prev) =>
      recalculate({
        ...prev,
        student_id: studentId,
        student_name: stu?.student_name || '',
        school_id: stu?.school_id || '',
        school_name: stu?.school_name || '',
        standard: stu?.standard || '',
        medium: stu?.medium || '',
      })
    );
  };

  const handleMarkChange = (field, value) => {
    const maxAllowed = Number(form.max_marks_per_subject) || 100;
    const numeric = value === '' ? '' : Math.min(maxAllowed, Math.max(0, Number(value)));
    setForm((prev) => recalculate({ ...prev, [field]: numeric }));
  };

  const handleManualStatusSelect = (optionId) => {
    const chosen = resultOptions.find((o) => o.id === optionId);
    setForm((prev) => ({
      ...prev,
      manualOverrideStatus: true,
      result_option_id: optionId,
      result_status: chosen ? chosen.option_label : prev.result_status,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id) {
      toast.error('Please select a student.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        student_name: form.student_name,
        school_id: form.school_id,
        school_name: form.school_name,
        standard: form.standard,
        medium: form.medium,
        exam_name: form.exam_name.trim() || 'Annual Examination',
        max_marks_per_subject: Number(form.max_marks_per_subject) || 100,
        subject_1_marks: Number(form.subject_1_marks) || 0,
        subject_2_marks: Number(form.subject_2_marks) || 0,
        subject_3_marks: Number(form.subject_3_marks) || 0,
        subject_4_marks: Number(form.subject_4_marks) || 0,
        subject_5_marks: Number(form.subject_5_marks) || 0,
        total_marks: form.total_marks,
        obtained_marks: form.obtained_marks,
        percentage: form.percentage,
        result_option_id: form.result_option_id || null,
        result_status: form.result_status,
        remarks: form.remarks.trim() || null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save examination record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-blue-300" />
            <h2 className="text-lg font-bold">
              {initialData ? 'Edit Examination Marks' : 'Enter Examination Marks'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-blue-200 hover:bg-blue-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto p-6">
          {/* Student Selection & Auto-Populated School Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label-text">1 & 2. Select Student *</label>
              <select
                disabled={!!initialData}
                value={form.student_id}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose Registered Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.student_name} ({st.form_number} • {st.standard})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Exam Title</label>
              <input
                type="text"
                value={form.exam_name}
                onChange={(e) => setForm((prev) => ({ ...prev, exam_name: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">3. School Name</label>
              <input type="text" disabled value={form.school_name} className="input-field" />
            </div>

            <div>
              <label className="label-text">4 & 5. Standard / Medium</label>
              <input
                type="text"
                disabled
                value={form.standard ? `${form.standard} • ${form.medium}` : ''}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Max Marks Per Subject</label>
              <input
                type="number"
                min={10}
                max={500}
                value={form.max_marks_per_subject}
                onChange={(e) =>
                  setForm((prev) =>
                    recalculate({ ...prev, max_marks_per_subject: Number(e.target.value) || 100 })
                  )
                }
                className="input-field"
              />
            </div>
          </div>

          {/* 5 Subjects Marks Grid */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
              Subject-Wise Obtained Marks (Out of {form.max_marks_per_subject} each)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num}>
                  <label className="label-text">Subject {num} *</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={form.max_marks_per_subject}
                    required
                    value={form[`subject_${num}_marks`]}
                    onChange={(e) => handleMarkChange(`subject_${num}_marks`, e.target.value)}
                    placeholder="0"
                    className="input-field text-center font-semibold"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live Calculated Results Summary */}
          <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:grid-cols-4">
            <div>
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-blue-700">
                <Calculator className="h-3.5 w-3.5" />
                Total Marks
              </span>
              <p className="mt-1 text-xl font-bold text-slate-900">{form.total_marks}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase text-blue-700">
                Obtained Marks
              </span>
              <p className="mt-1 text-xl font-bold text-blue-700">{form.obtained_marks}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase text-blue-700">
                Percentage
              </span>
              <p className="mt-1 text-xl font-bold text-emerald-700">{form.percentage}%</p>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase text-blue-700">
                Result Status (12 Choices)
              </label>
              <select
                value={form.result_option_id || ''}
                onChange={(e) => handleManualStatusSelect(e.target.value)}
                className="input-field mt-1 py-1.5 text-xs font-semibold"
              >
                {resultOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.option_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-4">
            <label className="label-text">15. Remarks (Optional)</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="Teacher or examiner remarks..."
              className="input-field"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Saving Result...' : initialData ? 'Update Result' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}