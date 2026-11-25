import React, { useEffect, useState } from 'react';
import { X, Save, FileSpreadsheet, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  calculateTwoSubjectResult,
  getSubjectMaxMarksByStandard,
} from '../../utils/gradeCalculator';

const initialForm = {
  student_id: '',
  student_name: '',
  school_id: '',
  school_name: '',
  standard: '4th',
  medium: '',
  exam_name: 'Pradnya Shodh Examination',
  subject_1_name: 'Marathi & Mathematics (मराठी व गणित)',
  subject_2_name: 'English & Intelligence (इंग्रजी व बुद्धिमत्ता)',
  subject_1_max_marks: 150,
  subject_2_max_marks: 100,
  subject_1_marks: '',
  subject_2_marks: '',
  total_marks: 250,
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
      const { sub1Max, sub2Max, totalMax } = getSubjectMaxMarksByStandard(initialData.standard);
      setForm({
        student_id: initialData.student_id || '',
        student_name: initialData.student_name || '',
        school_id: initialData.school_id || '',
        school_name: initialData.school_name || '',
        standard: initialData.standard || '4th',
        medium: initialData.medium || '',
        exam_name: initialData.exam_name || 'Pradnya Shodh Examination',
        subject_1_name: initialData.subject_1_name || 'Marathi & Mathematics (मराठी व गणित)',
        subject_2_name: initialData.subject_2_name || 'English & Intelligence (इंग्रजी व बुद्धिमत्ता)',
        subject_1_max_marks: Number(initialData.subject_1_max_marks) || sub1Max,
        subject_2_max_marks: Number(initialData.subject_2_max_marks) || sub2Max,
        subject_1_marks: initialData.subject_1_marks ?? '',
        subject_2_marks: initialData.subject_2_marks ?? '',
        total_marks: Number(initialData.total_marks) || totalMax,
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
    const calc = calculateTwoSubjectResult({
      subject1Marks: updatedState.subject_1_marks,
      subject2Marks: updatedState.subject_2_marks,
      standard: updatedState.standard,
      resultOptions,
    });

    return {
      ...updatedState,
      subject_1_max_marks: calc.sub1Max,
      subject_2_max_marks: calc.sub2Max,
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
    const std = stu?.standard || '4th';
    const { sub1Max, sub2Max } = getSubjectMaxMarksByStandard(std);

    setForm((prev) =>
      recalculate({
        ...prev,
        student_id: studentId,
        student_name: stu?.student_name || '',
        school_id: stu?.school_id || '',
        school_name: stu?.school_name || '',
        standard: std,
        medium: stu?.medium || '',
        subject_1_max_marks: sub1Max,
        subject_2_max_marks: sub2Max,
      })
    );
  };

  const handleMarkChange = (field, value, maxAllowed) => {
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
        exam_name: form.exam_name.trim() || 'Pradnya Shodh Examination',
        subject_1_name: form.subject_1_name,
        subject_2_name: form.subject_2_name,
        subject_1_max_marks: form.subject_1_max_marks,
        subject_2_max_marks: form.subject_2_max_marks,
        subject_1_marks: Number(form.subject_1_marks) || 0,
        subject_2_marks: Number(form.subject_2_marks) || 0,
        subject_3_marks: 0,
        subject_4_marks: 0,
        subject_5_marks: 0,
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
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label-text">Select Student *</label>
              <select
                disabled={!!initialData}
                value={form.student_id}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose Registered Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.student_name} ({st.form_number} • {st.standard} Std)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">School Name</label>
              <input type="text" disabled value={form.school_name} className="input-field" />
            </div>

            <div>
              <label className="label-text">Standard / Medium</label>
              <input
                type="text"
                disabled
                value={form.standard ? `${form.standard} • ${form.medium}` : ''}
                className="input-field"
              />
            </div>
          </div>

          {/* 2-Subject Marks Entry Box */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Subject-Wise Marks ({form.standard} Standard Scheme)
              </p>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                Max: {form.subject_1_max_marks} + {form.subject_2_max_marks} = {form.total_marks}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <label className="label-text">
                  Subject 1: Marathi &amp; Mathematics (Out of {form.subject_1_max_marks}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={form.subject_1_max_marks}
                  required
                  value={form.subject_1_marks}
                  onChange={(e) =>
                    handleMarkChange('subject_1_marks', e.target.value, form.subject_1_max_marks)
                  }
                  placeholder={`0 - ${form.subject_1_max_marks}`}
                  className="input-field mt-1 text-center text-base font-bold"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <label className="label-text">
                  Subject 2: English &amp; Intelligence (Out of {form.subject_2_max_marks}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={form.subject_2_max_marks}
                  required
                  value={form.subject_2_marks}
                  onChange={(e) =>
                    handleMarkChange('subject_2_marks', e.target.value, form.subject_2_max_marks)
                  }
                  placeholder={`0 - ${form.subject_2_max_marks}`}
                  className="input-field mt-1 text-center text-base font-bold"
                />
              </div>
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
                Result Status
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

          {/* Remarks (Printed as शेरा on Certificate) */}
          <div className="mt-4">
            <label className="label-text">Remarks / Rank (Printed on Certificate)</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g., First in State / राज्यात पहिला / Distinction"
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