import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  FilterX,
  Search,
  Award,
  Users,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { getAllSchoolsDropdown, getSchoolFilterOptions } from '../services/schoolService';
import { getResultOptions } from '../services/resultOptionService';
import { getOrganizationSettings } from '../services/organizationService';
import { exportToCsv } from '../utils/csvHelper';
import { exportTableToPdf } from '../utils/pdfExportHelper';
import { BADGE_COLOR_CLASSES } from '../utils/gradeCalculator';
import { STANDARDS_LIST, MEDIUMS_LIST, ACADEMIC_YEARS_LIST } from '../utils/validators';
import { useDebounce } from '../hooks/useDebounce';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgSettings, setOrgSettings] = useState(null);

  // Dropdown Options
  const [schools, setSchools] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [resultOptions, setResultOptions] = useState([]);

  // Multi-Dimensional Report Filters
  const [schoolId, setSchoolId] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [standard, setStandard] = useState('');
  const [medium, setMedium] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudent = useDebounce(studentSearch, 300);

  useEffect(() => {
    Promise.all([
      getAllSchoolsDropdown(),
      getSchoolFilterOptions(),
      getResultOptions(),
      getOrganizationSettings(),
    ])
      .then(([scData, locOpts, roData, orgData]) => {
        setSchools(scData);
        setDistricts(locOpts.districts);
        setTalukas(locOpts.talukas);
        setResultOptions(roData);
        setOrgSettings(orgData);
      })
      .catch(console.error);
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select(`
          id,
          form_number,
          student_name,
          parent_mobile,
          gender,
          standard,
          medium,
          academic_year,
          counselor_name,
          exam_center,
          school_id,
          school_name,
          schools!inner (
            district,
            taluka,
            guidance_teacher_name,
            teacher_mobile
          ),
          examinations (
            id,
            subject_1_marks,
            subject_2_marks,
            subject_1_max_marks,
            subject_2_max_marks,
            total_marks,
            obtained_marks,
            percentage,
            result_status,
            remarks,
            result_options (
              badge_color,
              is_passing
            )
          )
        `)
        .order('student_name', { ascending: true });

      if (schoolId) query = query.eq('school_id', schoolId);
      if (district) query = query.eq('schools.district', district);
      if (taluka) query = query.eq('schools.taluka', taluka);
      if (standard) query = query.eq('standard', standard);
      if (medium) query = query.eq('medium', medium);
      if (academicYear) query = query.eq('academic_year', academicYear);
      if (debouncedStudent.trim()) {
        const term = debouncedStudent.trim();
        query = query.or(`student_name.ilike.%${term}%,form_number.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let flattened = (data || []).map((st) => {
        const exam = Array.isArray(st.examinations) ? st.examinations[0] : st.examinations;
        return {
          studentId: st.id,
          formNumber: st.form_number,
          studentName: st.student_name,
          gender: st.gender || '-',
          parentMobile: st.parent_mobile || '-',
          schoolName: st.school_name,
          district: st.schools?.district || '-',
          taluka: st.schools?.taluka || '-',
          guidanceTeacher: st.schools?.guidance_teacher_name || '-',
          counselorName: st.counselor_name || '-',
          examCenter: st.exam_center || '-',
          academicYear: st.academic_year || '2026-27',
          standard: st.standard,
          medium: st.medium,
          hasExam: !!exam,
          s1: exam?.subject_1_marks ?? '-',
          s2: exam?.subject_2_marks ?? '-',
          obtainedMarks: exam?.obtained_marks ?? 0,
          totalMarks: exam?.total_marks ?? 250,
          percentage: exam ? Number(exam.percentage) : null,
          resultStatus: exam?.result_status || 'Not Evaluated',
          badgeColor: exam?.result_options?.badge_color || 'slate',
          isPassing: exam?.result_options?.is_passing ?? false,
        };
      });

      if (resultStatus) {
        flattened = flattened.filter((r) => r.resultStatus === resultStatus);
      }

      setRows(flattened);
    } catch (err) {
      toast.error(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, district, taluka, standard, medium, academicYear, resultStatus, debouncedStudent]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const evaluatedRows = rows.filter((r) => r.hasExam);
  const avgPercentage =
    evaluatedRows.length > 0
      ? (
          evaluatedRows.reduce((acc, r) => acc + (r.percentage || 0), 0) / evaluatedRows.length
        ).toFixed(2)
      : '0.00';
  const passedCount = evaluatedRows.filter((r) => r.isPassing).length;
  const passRate =
    evaluatedRows.length > 0 ? ((passedCount / evaluatedRows.length) * 100).toFixed(1) : '0.0';

  const handleExportCsv = () => {
    try {
      exportToCsv('comprehensive_academic_report.csv', rows, [
        { key: 'formNumber', header: 'Exam / Form No.' },
        { key: 'studentName', header: 'Student Name' },
        { key: 'gender', header: 'Gender' },
        { key: 'parentMobile', header: 'Parent Mobile' },
        { key: 'schoolName', header: 'School Name' },
        { key: 'taluka', header: 'Taluka' },
        { key: 'district', header: 'District' },
        { key: 'guidanceTeacher', header: 'Guidance Teacher' },
        { key: 'counselorName', header: 'Counselor' },
        { key: 'examCenter', header: 'Exam Center' },
        { key: 'academicYear', header: 'Academic Year' },
        { key: 'standard', header: 'Standard' },
        { key: 'medium', header: 'Medium' },
        { key: 's1', header: 'Subject 1 (Mar/Math)' },
        { key: 's2', header: 'Subject 2 (Eng/IQ)' },
        { key: 'obtainedMarks', header: 'Obtained Marks' },
        { key: 'totalMarks', header: 'Total Marks' },
        { key: 'percentage', header: 'Percentage (%)' },
        { key: 'resultStatus', header: 'Result Status' },
      ]);
      toast.success(`Exported ${rows.length} report rows to CSV.`);
    } catch (err) {
      toast.error(err.message || 'CSV export failed.');
    }
  };

  const handleExportPdf = () => {
    try {
      exportTableToPdf({
        filename: 'comprehensive_academic_report.pdf',
        title: 'Comprehensive Academic & Examination Report',
        subtitle: `Matched: ${rows.length} | Mean: ${avgPercentage}% | Pass: ${passRate}%`,
        orgName: orgSettings?.org_name || 'Student Data Management System',
        columns: [
          { key: 'formNumber', header: 'Exam No.' },
          { key: 'studentName', header: 'Student Name' },
          { key: 'schoolName', header: 'School' },
          { key: 'standard', header: 'Std' },
          { key: 's1', header: 'Sub 1' },
          { key: 's2', header: 'Sub 2' },
          { key: 'obtainedMarks', header: 'Obtained' },
          { key: 'totalMarks', header: 'Total' },
          { key: 'percentage', header: '%' },
          { key: 'resultStatus', header: 'Result' },
        ],
        rows,
      });
      toast.success('Analytical Report PDF downloaded.');
    } catch (err) {
      toast.error(err.message || 'PDF export failed.');
    }
  };

  const resetAll = () => {
    setSchoolId('');
    setDistrict('');
    setTaluka('');
    setStandard('');
    setMedium('');
    setAcademicYear('');
    setResultStatus('');
    setStudentSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytical Academic Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Cross-filter by school, district, taluka, standard, medium, academic year, or result status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportCsv} disabled={rows.length === 0} className="btn-secondary">
            <Download className="h-4 w-4" />
            Export CSV ({rows.length})
          </button>
          <button onClick={handleExportPdf} disabled={rows.length === 0} className="btn-primary">
            <FileText className="h-4 w-4" />
            Download PDF ({rows.length})
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Panel */}
      <div className="card-panel p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by School (All)</option>
            {schools.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.school_name}</option>
            ))}
          </select>

          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by District (All)</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={taluka}
            onChange={(e) => setTaluka(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by Taluka (All)</option>
            {talukas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by Standard (All)</option>
            {STANDARDS_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by Medium (All)</option>
            {MEDIUMS_LIST.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by Academic Year (All)</option>
            {ACADEMIC_YEARS_LIST.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            value={resultStatus}
            onChange={(e) => setResultStatus(e.target.value)}
            className="input-field"
          >
            <option value="">Filter by Result Status (All)</option>
            {resultOptions.map((ro) => (
              <option key={ro.id} value={ro.option_label}>{ro.option_label}</option>
            ))}
            <option value="Not Evaluated">Not Evaluated</option>
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Student name or exam no..."
              className="input-field pl-9"
            />
          </div>
        </div>

        {(schoolId || district || taluka || standard || medium || academicYear || resultStatus || studentSearch) && (
          <div className="mt-3 flex justify-end border-t border-slate-100 pt-2.5">
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear All Report Filters
            </button>
          </div>
        )}
      </div>

      {/* Live Report Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Matched Students</p>
            <p className="text-xl font-bold text-slate-900">{rows.length}</p>
          </div>
        </div>

        <div className="card-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Evaluated Exams</p>
            <p className="text-xl font-bold text-slate-900">{evaluatedRows.length}</p>
          </div>
        </div>

        <div className="card-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Cohort Mean %</p>
            <p className="text-xl font-bold text-slate-900">{avgPercentage}%</p>
          </div>
        </div>

        <div className="card-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Pass Percentage</p>
            <p className="text-xl font-bold text-emerald-700">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Report Table */}
      {loading ? (
        <LoadingSpinner text="Generating analytical report..." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No matching records for this report criteria"
          description="Try clearing one or more filters to broaden the report dataset."
        />
      ) : (
        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Exam No.</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">School (Taluka, Dist)</th>
                  <th className="px-4 py-3">Std / AY</th>
                  <th className="px-4 py-3 text-center">Sub 1 / Sub 2</th>
                  <th className="px-4 py-3 text-right">Marks</th>
                  <th className="px-4 py-3 text-right">%</th>
                  <th className="px-4 py-3">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((r) => (
                  <tr key={r.studentId} className="hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-blue-700">
                      {r.formNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{r.studentName}</p>
                      <p className="text-[11px] text-slate-400">{r.parentMobile}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.schoolName}</p>
                      <p className="text-[11px] text-slate-400">
                        {r.taluka}, {r.district}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {r.standard} • {r.academicYear}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono text-slate-700">
                      {r.s1} / {r.s2}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">
                      {r.hasExam ? `${r.obtainedMarks} / ${r.totalMarks}` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-blue-700">
                      {r.percentage !== null ? `${r.percentage}%` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                          BADGE_COLOR_CLASSES[r.badgeColor] || BADGE_COLOR_CLASSES.slate
                        }`}
                      >
                        {r.resultStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}