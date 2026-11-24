import { supabase } from '../lib/supabaseClient';

export async function getDashboardAnalytics() {
  const [schoolsRes, studentsRes, examsRes] = await Promise.all([
    supabase.from('schools').select('id, school_name, district, taluka, standard, medium'),
    supabase.from('students').select('id, school_id, school_name, standard, medium, gender'),
    supabase.from('examinations').select('id, school_id, school_name, standard, medium, obtained_marks, total_marks, percentage, result_status'),
  ]);

  if (schoolsRes.error) throw schoolsRes.error;
  if (studentsRes.error) throw studentsRes.error;
  if (examsRes.error) throw examsRes.error;

  const schools = schoolsRes.data || [];
  const students = studentsRes.data || [];
  const exams = examsRes.data || [];

  // Gender breakdown
  const maleStudents = students.filter((s) => s.gender === 'Male').length;
  const femaleStudents = students.filter((s) => s.gender === 'Female').length;

  // Marks & percentage totals
  const totalObtainedMarks = exams.reduce((acc, e) => acc + Number(e.obtained_marks || 0), 0);
  const totalMaxMarks = exams.reduce((acc, e) => acc + Number(e.total_marks || 0), 0);
  const averagePercentage =
    exams.length > 0
      ? Number(
          (exams.reduce((acc, e) => acc + Number(e.percentage || 0), 0) / exams.length).toFixed(2)
        )
      : 0;

  // 1. School-wise student statistics
  const schoolMap = new Map();
  schools.forEach((sc) => {
    schoolMap.set(sc.id, {
      schoolId: sc.id,
      schoolName: sc.school_name,
      district: sc.district,
      students: 0,
      exams: 0,
      avgPercentage: 0,
      _pctSum: 0,
    });
  });

  students.forEach((st) => {
    const entry = schoolMap.get(st.school_id) || {
      schoolId: st.school_id,
      schoolName: st.school_name,
      district: '-',
      students: 0,
      exams: 0,
      avgPercentage: 0,
      _pctSum: 0,
    };
    entry.students += 1;
    schoolMap.set(st.school_id, entry);
  });

  exams.forEach((ex) => {
    const entry = schoolMap.get(ex.school_id);
    if (entry) {
      entry.exams += 1;
      entry._pctSum += Number(ex.percentage || 0);
      entry.avgPercentage = Number((entry._pctSum / entry.exams).toFixed(2));
    }
  });

  const schoolWiseStats = Array.from(schoolMap.values()).sort((a, b) => b.students - a.students);

  // 2. Standard-wise student statistics
  const standardMap = new Map();
  students.forEach((st) => {
    const std = st.standard || 'Unspecified';
    const curr = standardMap.get(std) || { standard: std, students: 0, male: 0, female: 0 };
    curr.students += 1;
    if (st.gender === 'Male') curr.male += 1;
    if (st.gender === 'Female') curr.female += 1;
    standardMap.set(std, curr);
  });
  const standardWiseStats = Array.from(standardMap.values()).sort((a, b) =>
    a.standard.localeCompare(b.standard, undefined, { numeric: true })
  );

  // 3. Medium-wise statistics
  const mediumMap = new Map();
  students.forEach((st) => {
    const med = st.medium || 'Unspecified';
    const curr = mediumMap.get(med) || { medium: med, students: 0, schools: new Set() };
    curr.students += 1;
    curr.schools.add(st.school_id);
    mediumMap.set(med, curr);
  });
  const mediumWiseStats = Array.from(mediumMap.values()).map((m) => ({
    medium: m.medium,
    students: m.students,
    schoolCount: m.schools.size,
  }));

  return {
    kpis: {
      totalSchools: schools.length,
      totalStudents: students.length,
      maleStudents,
      femaleStudents,
      totalExams: exams.length,
      totalObtainedMarks: Number(totalObtainedMarks.toFixed(2)),
      totalMaxMarks: Number(totalMaxMarks.toFixed(2)),
      averagePercentage,
    },
    schoolWiseStats,
    standardWiseStats,
    mediumWiseStats,
  };
}