import React from 'react';
import { X, School, MapPin, Phone, UserCheck, Mail, Hash } from 'lucide-react';

export default function SchoolViewModal({ school, onClose }) {
  if (!school) return null;

  const details = [
    { label: 'Form Number', value: school.form_number, icon: Hash },
    { label: 'Standard & Medium', value: `${school.standard} — ${school.medium}`, icon: School },
    { label: 'Address', value: school.school_address, icon: MapPin },
    { label: 'At Post', value: school.at_post },
    { label: 'Taluka', value: school.taluka },
    { label: 'District & PIN', value: `${school.district} - ${school.pin_code}` },
    { label: 'School Phone', value: school.school_phone, icon: Phone },
    { label: 'Guidance Teacher', value: school.guidance_teacher_name, icon: UserCheck },
    { label: 'Teacher Mobile', value: school.teacher_mobile, icon: Phone },
    { label: 'School Email', value: school.school_email || 'Not Provided', icon: Mail },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-6 py-4 text-white">
          <div>
            <span className="rounded bg-blue-800 px-2 py-0.5 font-mono text-xs text-blue-200">
              {school.form_number}
            </span>
            <h2 className="mt-1 text-lg font-bold">{school.school_name}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-blue-200 hover:bg-blue-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{item.value}</p>
            </div>
          ))}
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