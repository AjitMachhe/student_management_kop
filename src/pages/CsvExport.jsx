import React, { useEffect, useState } from 'react';
import { Download, FileText, School, Users, FileSpreadsheet, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { getAllSchoolsDropdown } from '../services/schoolService';
import { getOrganizationSettings } from '../services/organizationService';
import { exportToCsv } from '../utils/csvHelper';
import { exportTableToPdf } from '../utils/pdfExportHelper';
import { STANDARDS_LIST } from '../utils/validators';

export default function CsvExport() {
  const [schools, setSchools] = useState([]);
  const [orgSettings, setOrgSettings] = useState(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    Promise.all([getAllSchoolsDropdown(), getOrganizationSettings()])
      .then(([scData, orgData]) => {
        setSchools(scData);
        setOrgSettings(orgData);
      })
      .catch(console.error);
  }, []);

  const handleBulkExport = async (type, format = 'csv') => {
    const key = `${type}_${format}`;
    setExporting(key);
    try {
      const orgName = orgSettings?.org_name || 'Student Data Management System';

      if (type === 'all_schools') {
        const { data, error } = await supabase
          .from('schools')
          .select('form_number, school_name, at_post, taluka, district, pin_code, medium, school_phone, guidance_teacher_name, teacher_mobile')
          .order('school_name', { ascending: true });
        if (error) throw error;

        if (format === 'csv') {
          exportToCsv('all_schools_records.csv', data);
        } else {
          exportTableToPdf({
            filename: 'all_schools_records.pdf',
            title: 'Complete Registered Schools Directory',
            subtitle: `Total Schools: ${data.length}`,
            orgName,
            columns: [
              { key: 'form_number', header: 'Form No.' },
              { key: 'school_name', header: 'School Name' },
              { key: 'taluka', header: 'Taluka' },
              { key: 'district', header: 'District' },
              { key: 'medium', header: 'Medium' },
              { key: 'guidance_teacher_name', header: 'Guidance Teacher' },
              { key: 'teacher_mobile', header: 'Teacher Mobile' },
            ],
            rows: data,
          });
        }
        toast.success(`Exported ${data.length} school records (${format.toUpperCase()}).`);
      } else if (type === 'all_students') {
        const { data, error } = await supabase
          .from('students')
          .select('form_number, student_name, parent_mobile, school_name, standard, medium, academic_year, counselor_name, exam_center')
          .order('student_name', { ascending: true });
        if (error) throw error;

        if (format === 'csv') {
          exportToCsv('all_students_records.csv', data);
        } else {
          exportTableToPdf({
            filename: 'all_students_records.pdf',
            title: 'Complete Registered Students Roster',
            subtitle: `Total Students: ${data.length}`,
            orgName,
            columns: [
              { key: 'form_number', header: 'Exam No.' },
              { key: 'student_name', header: 'Student Name' },
              { key: 'school_name', header: 'School Name' },
              { key: 'standard', header: 'Std' },
              { key: 'academic_year', header: 'AY' },
              { key: 'counselor_name', header: 'Counselor' },
              { key: 'exam_center', header: 'Exam Center' },
            ],
            rows: data,
          });
        }
        toast.success(`Exported ${data.length} student records (${format.toUpperCase()}).`);
      } else if (type === 'all_exams') {
        const { data, error } = await supabase
          .from('examinations')
          .select('student_name, school_name, standard, medium, subject_1_marks, subject_2_marks, obtained_marks, total_marks, percentage, result_status, remarks')
          .order('percentage', { ascending: false });
        if (error) throw error;

        if (format === 'csv') {
          exportToCsv('all_examination_records.csv', data);
        } else {
          exportTableToPdf({
            filename: 'all_examination_records.pdf',
            title: 'Master Examination Merit & Result Sheet',
            subtitle: `Total Evaluated: ${data.length}`,
            orgName,
            columns: [
              { key: 'student_name', header: 'Student Name' },
              { key: 'school_name', header: 'School Name' },
              { key: 'standard', header: 'Std' },
              { key: 'subject_1_marks', header: 'Sub 1' },
              { key: 'subject_2_marks', header: 'Sub 2' },
              { key: 'obtained_marks', header: 'Obtained' },
              { key: 'total_marks', header: 'Total' },
              { key: 'percentage', header: '%' },
              { key: 'result_status', header: 'Status' },
            ],
            rows: data,
          });
        }
        toast.success(`Exported ${data.length} examination records (${format.toUpperCase()}).`);
      } else if (type === 'school_wise_students') {
        if (!selectedSchoolId) {
          toast.error('Please choose a school first.');
          return;
        }
        const { data, error } = await supabase
          .from('students')
          .select('form_number, student_name, parent_mobile, school_name, standard, medium, academic_year, counselor_name, exam_center')
          .eq('school_id', selectedSchoolId)
          .order('student_name', { ascending: true });
        if (error) throw error;

        if (format === 'csv') {
          exportToCsv('school_wise_student_list.csv', data);
        } else {
          exportTableToPdf({
            filename: 'school_wise_student_list.pdf',
            title: `School Student Roster: ${data[0]?.school_name || ''}`,
            subtitle: `Total Students: ${data.length}`,
            orgName,
            columns: [
              { key: 'form_number', header: 'Exam No.' },
              { key: 'student_name', header: 'Student Name' },
              { key: 'standard', header: 'Std' },
              { key: 'medium', header: 'Medium' },
              { key: 'counselor_name', header: 'Counselor' },
              { key: 'exam_center', header: 'Exam Center' },
            ],
            rows: data,
          });
        }
        toast.success(`Exported ${data.length} students (${format.toUpperCase()}).`);
      } else if (type === 'standard_wise_records') {
        if (!selectedStandard) {
          toast.error('Please choose a standard first.');
          return;
        }
        const { data, error } = await supabase
          .from('examinations')
          .select('student_name, school_name, standard, medium, subject_1_marks, subject_2_marks, obtained_marks, total_marks, percentage, result_status')
          .eq('standard', selectedStandard)
          .order('percentage', { ascending: false });
        if (error) throw error;

        if (format === 'csv') {
          exportToCsv(`standard_${selectedStandard}_records.csv`, data);
        } else {
          exportTableToPdf({
            filename: `standard_${selectedStandard}_records.pdf`,
            title: `${selectedStandard} Standard Merit & Examination Sheet`,
            subtitle: `Total Students: ${data.length}`,
            orgName,
            columns: [
              { key: 'student_name', header: 'Student Name' },
              { key: 'school_name', header: 'School Name' },
              { key: 'subject_1_marks', header: 'Sub 1' },
              { key: 'subject_2_marks', header: 'Sub 2' },
              { key: 'obtained_marks', header: 'Obtained' },
              { key: 'total_marks', header: 'Total' },
              { key: 'percentage', header: '%' },
              { key: 'result_status', header: 'Status' },
            ],
            rows: data,
          });
        }
        toast.success(`Exported ${data.length} records for ${selectedStandard} (${format.toUpperCase()}).`);
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
        <h1 className="text-2xl font-bold text-slate-900">Data Export Center (CSV &amp; PDF)</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Download master datasets or targeted school-wise and standard-wise rosters in CSV or printable PDF
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
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleBulkExport('all_schools', 'csv')}
              disabled={!!exporting}
              className="btn-primary"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleBulkExport('all_schools', 'pdf')}
              disabled={!!exporting}
              className="btn-secondary"
            >
              <FileText className="h-4 w-4 text-red-600" />
              PDF
            </button>
          </div>
        </div>

        <div className="card-panel flex flex-col justify-between p-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">All Student Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Complete student registry with exam numbers, counselors, academic years, and exam centers.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleBulkExport('all_students', 'csv')}
              disabled={!!exporting}
              className="btn-primary"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleBulkExport('all_students', 'pdf')}
              disabled={!!exporting}
              className="btn-secondary"
            >
              <FileText className="h-4 w-4 text-red-600" />
              PDF
            </button>
          </div>
        </div>

        <div className="card-panel flex flex-col justify-between p-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">All Examination Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              2-Subject marks, totals, percentages, and result statuses for all evaluated students.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleBulkExport('all_exams', 'csv')}
              disabled={!!exporting}
              className="btn-primary"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleBulkExport('all_exams', 'pdf')}
              disabled={!!exporting}
              className="btn-secondary"
            >
              <FileText className="h-4 w-4 text-red-600" />
              PDF
            </button>
          </div>
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
              onClick={() => handleBulkExport('school_wise_students', 'csv')}
              className="btn-secondary shrink-0"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleBulkExport('school_wise_students', 'pdf')}
              className="btn-secondary shrink-0"
            >
              <FileText className="h-4 w-4 text-red-600" />
              PDF
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
              onClick={() => handleBulkExport('standard_wise_records', 'csv')}
              className="btn-secondary shrink-0"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleBulkExport('standard_wise_records', 'pdf')}
              className="btn-secondary shrink-0"
            >
              <FileText className="h-4 w-4 text-red-600" />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}