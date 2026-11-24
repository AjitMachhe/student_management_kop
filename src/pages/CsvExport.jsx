import React, { useEffect, useState } from 'react';
import { Download, School, Users, FileSpreadsheet, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { getAllSchoolsDropdown } from '../services/schoolService';
import { exportToCsv } from '../utils/csvHelper';
import { STANDARDS_LIST } from '../utils/validators';

export default function CsvExport() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    getAllSchoolsDropdown().then(setSchools).catch(console.error);
  }, []);

  const handleBulkExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'all_schools') {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('school_name', { ascending: true });
        if (error) throw error;
        exportToCsv('all_schools_records.csv', data);
        toast.success(`Exported ${data.length} school records.`);
      } else if (type === 'all_students') {
        const { data, error } = await supabase
          .from('students')
          .select('form_number, student_name, first_name, father_name, student_surname, parent_mobile, school_name, standard, medium, gender, date_of_birth, student_address')
          .order('student_name', { ascending: true });
        if (error) throw error;
        exportToCsv('all_students_records.csv', data);
        toast.success(`Exported ${data.length} student records.`);
      } else if (type === 'all_exams') {
        const { data, error } = await supabase
          .from('examinations')
          .select('student_name, school_name, standard, medium, subject_1_marks, subject_2_marks, subject_3_marks, subject_4_marks, subject_5_marks, total_marks, obtained_marks, percentage, result_status, remarks')
          .order('percentage', { ascending: false });
        if (error) throw error;
        exportToCsv('all_examination_records.csv', data);
        toast.success(`Exported ${data.length} examination records.`);
      } else if (type === 'school_wise_students') {
        if (!selectedSchoolId) {
          toast.error('Please choose a school first.');
          return;
        }
        const { data, error } = await supabase
          .from('students')
          .select('form_number, student_name, parent_mobile, school_name, standard, medium, gender')
          .eq('school_id', selectedSchoolId)
          .order('student_name', { ascending: true });
        if (error) throw error;
        exportToCsv('school_wise_student_list.csv', data);
        toast.success(`Exported ${data.length} students for selected school.`);
      } else if (type === 'standard_wise_records') {
        if (!selectedStandard) {
          toast.error('Please choose a standard first.');
          return;
        }
        const { data, error } = await supabase
          .from('examinations')
          .select('student_name, school_name, standard, medium, obtained_marks, total_marks, percentage, result_status')
          .eq('standard', selectedStandard)
          .order('percentage', { ascending: false });
        if (error) throw error;
        exportToCsv(`standard_${selectedStandard}_records.csv`, data);
        toast.success(`Exported ${data.length} records for ${selectedStandard}.`);
      }
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CSV Export Center</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Download complete master datasets or targeted school-wise and standard-wise CSV reports
        </p>
      </div>

      {/* Master Dataset Exports */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="card-panel flex flex-col justify-between p-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <School className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">All School Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Complete directory of registered schools, locations, and guidance teacher contacts.
            </p>
          </div>
          <button
            onClick={() => handleBulkExport('all_schools')}
            disabled={exporting === 'all_schools'}
            className="btn-primary mt-5 w-full"
          >
            <Download className="h-4 w-4" />
            Export All Schools
          </button>
        </div>

        <div className="card-panel flex flex-col justify-between p-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">All Student Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Complete student registry with parent details, form numbers, and school mappings.
            </p>
          </div>
          <button
            onClick={() => handleBulkExport('all_students')}
            disabled={exporting === 'all_students'}
            className="btn-primary mt-5 w-full"
          >
            <Download className="h-4 w-4" />
            Export All Students
          </button>
        </div>

        <div className="card-panel flex flex-col justify-between p-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">All Examination Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Subject-wise marks, percentages, and 12-option result statuses for all students.
            </p>
          </div>
          <button
            onClick={() => handleBulkExport('all_exams')}
            disabled={exporting === 'all_exams'}
            className="btn-primary mt-5 w-full"
          >
            <Download className="h-4 w-4" />
            Export All Results
          </button>
        </div>
      </div>

      {/* Targeted Segment Exports */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="card-panel p-5">
          <div className="flex items-center gap-2 text-blue-700">
            <Filter className="h-4 w-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide">
              School-Wise Student List Export
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Select a specific institution to export its enrolled student roster.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">-- Select School --</option>
              {schools.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.school_name} ({sc.form_number})
                </option>
              ))}
            </select>
            <button
              onClick={() => handleBulkExport('school_wise_students')}
              className="btn-secondary shrink-0"
            >
              <Download className="h-4 w-4" />
              Export List
            </button>
          </div>
        </div>

        <div className="card-panel p-5">
          <div className="flex items-center gap-2 text-blue-700">
            <Filter className="h-4 w-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide">
              Standard-Wise Examination Export
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Export examination marks and merit rankings for a specific standard.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">-- Select Standard --</option>
              {STANDARDS_LIST.map((std) => (
                <option key={std} value={std}>{std}</option>
              ))}
            </select>
            <button
              onClick={() => handleBulkExport('standard_wise_records')}
              className="btn-secondary shrink-0"
            >
              <Download className="h-4 w-4" />
              Export Standard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}