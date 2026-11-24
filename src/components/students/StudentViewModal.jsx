import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function StudentViewModal({ student, onClose }) {
  if (!student) return null;

  const fields = [
    { label: 'Form Number', value: student.form_number },
    { label: 'Full Student Name', value: student.student_name },
    { label: 'First Name', value: student.first_name },
    { label: "Father's Name", value: student.father_name },
    { label: 'Surname', value: student.student_surname },
    { label: 'Parent Mobile', value: student.parent_mobile },
    { label: 'School Name', value: student.school_name },
    { label: 'District / Taluka', value: student.schools ? `${student.schools.district} / ${student.schools.taluka}` : '-' },
    { label: 'Standard & Medium', value: `${student.standard} — ${student.medium}` },
    { label: 'Gender', value: student.gender || 'Not Specified' },
    { label: 'Date of Birth', value: student.date_of_birth || 'Not Specified' },
    { label: 'Address', value: student.student_address || 'Not Specified' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-6 py-4 text-white">
          <div>
            <span className="rounded bg-blue-800 px-2 py-0.5 font-mono text-xs text-blue-200">
              {student.form_number}
            </span>
            <h2 className="mt-1 text-lg font-bold">{student.student_name}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-blue-200 hover:bg-blue-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {f.label}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Parent Signature Preview */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Parent Signature Attachment
            </p>
            {student.parent_signature_url ? (
              <div className="mt-2 flex items-center justify-between gap-4">
                {student.parent_signature_url.toLowerCase().endsWith('.pdf') ? (
                  <span className="text-sm font-medium text-slate-700">PDF Document Attached</span>
                ) : (
                  <img
                    src={student.parent_signature_url}
                    alt="Parent Signature"
                    className="h-16 rounded border border-slate-200 bg-white object-contain p-1"
                  />
                )}
                <a
                  href={student.parent_signature_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs"
                >
                  Open File
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No signature attachment uploaded.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}