import Papa from 'papaparse';
import { supabase } from '../lib/supabaseClient';
import { isValidIndianMobile, isValidPinCode, isValidSchoolPhone } from '../utils/validators';
import { calculateTwoSubjectResult } from '../utils/gradeCalculator';

export const ENTITY_SCHEMAS = {
  schools: {
    label: 'Schools',
    fields: [
      { key: 'school_name', label: 'School Name', required: true, aliases: ['school name', 'school', 'name'] },
      { key: 'school_address', label: 'School Address', required: true, aliases: ['address', 'school address'] },
      { key: 'at_post', label: 'At Post', required: true, aliases: ['at post', 'post', 'village', 'city'] },
      { key: 'taluka', label: 'Taluka', required: true, aliases: ['taluka', 'tehsil', 'block'] },
      { key: 'district', label: 'District', required: true, aliases: ['district', 'dist'] },
      { key: 'pin_code', label: 'PIN Code', required: true, aliases: ['pin', 'pin code', 'pincode', 'zip'] },
      { key: 'medium', label: 'Medium', required: true, aliases: ['medium', 'instruction medium'] },
      { key: 'school_phone', label: 'School Phone', required: true, aliases: ['school phone', 'phone', 'telephone'] },
      { key: 'guidance_teacher_name', label: 'Guidance Teacher Name', required: true, aliases: ['guidance teacher', 'teacher name', 'teacher'] },
      { key: 'teacher_mobile', label: 'Teacher Mobile', required: true, aliases: ['teacher mobile', 'mobile', 'teacher phone'] },
      { key: 'school_email', label: 'School Email', required: false, aliases: ['email', 'school email'] },
    ],
  },
  students: {
    label: 'Students',
    fields: [
      { key: 'first_name', label: 'First Name', required: true, aliases: ['first name', 'firstname', 'fname'] },
      { key: 'father_name', label: "Father's Name", required: true, aliases: ['father name', "father's name", 'middle name'] },
      { key: 'student_surname', label: 'Surname', required: true, aliases: ['surname', 'student surname', 'last name'] },
      { key: 'student_name', label: 'Full Student Name', required: false, aliases: ['student name', 'full name', 'name'] },
      { key: 'parent_mobile', label: 'Parent Mobile (Optional)', required: false, aliases: ['parent mobile', 'mobile', 'phone', 'contact'] },
      { key: 'school_name', label: 'School Name (Exact Match)', required: true, aliases: ['school name', 'school'] },
      { key: 'standard', label: 'Standard', required: true, aliases: ['standard', 'std', 'class'] },
      { key: 'medium', label: 'Medium', required: true, aliases: ['medium'] },
      { key: 'academic_year', label: 'Academic Year', required: false, aliases: ['academic year', 'year', 'ay'] },
      { key: 'counselor_name', label: 'Counselor Name', required: false, aliases: ['counselor', 'counselor name'] },
      { key: 'exam_center', label: 'Exam Center', required: false, aliases: ['exam center', 'center', 'center name'] },
      { key: 'gender', label: 'Gender', required: false, aliases: ['gender', 'sex'] },
      { key: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)', required: false, aliases: ['dob', 'date of birth'] },
      { key: 'student_address', label: 'Student Address', required: false, aliases: ['address', 'student address'] },
    ],
  },
  examinations: {
    label: 'Examination Results (2 Subjects)',
    fields: [
      { key: 'student_form_number', label: 'Exam / Form No.', required: false, aliases: ['form number', 'form no', 'exam no'] },
      { key: 'student_name', label: 'Student Full Name', required: true, aliases: ['student name', 'name'] },
      { key: 'school_name', label: 'School Name', required: true, aliases: ['school name', 'school'] },
      { key: 'subject_1_marks', label: 'Subject 1 Marks (Marathi & Maths)', required: true, aliases: ['subject 1', 'sub1', 'marks 1', 'marathi'] },
      { key: 'subject_2_marks', label: 'Subject 2 Marks (English & IQ)', required: true, aliases: ['subject 2', 'sub2', 'marks 2', 'english'] },
      { key: 'remarks', label: 'Remarks / Rank (शेरा)', required: false, aliases: ['remarks', 'rank', 'comment'] },
    ],
  },
};

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data || [],
        });
      },
      error: (err) => reject(err),
    });
  });
}

export function autoMapColumns(entityType, csvHeaders) {
  const schema = ENTITY_SCHEMAS[entityType];
  const mapping = {};

  schema.fields.forEach((field) => {
    const match = csvHeaders.find((header) => {
      const normalized = header.toLowerCase().replace(/[_-]/g, ' ').trim();
      return (
        normalized === field.key.replace(/_/g, ' ') ||
        field.aliases.includes(normalized)
      );
    });
    mapping[field.key] = match || '';
  });

  return mapping;
}

export async function validateMappedRows(entityType, rawRows, columnMapping) {
  const [schoolsRes, studentsRes, resultOptsRes] = await Promise.all([
    supabase.from('schools').select('id, school_name, taluka, district, medium'),
    supabase.from('students').select('id, form_number, first_name, father_name, student_surname, student_name, school_id, school_name, standard, medium'),
    supabase.from('result_options').select('*').order('display_order', { ascending: true }),
  ]);

  const existingSchools = schoolsRes.data || [];
  const existingStudents = studentsRes.data || [];
  const resultOptions = resultOptsRes.data || [];

  const seenInFile = new Set();
  const validated = [];

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2;
    const mapped = {};
    Object.entries(columnMapping).forEach(([dbKey, csvCol]) => {
      mapped[dbKey] = csvCol ? String(raw[csvCol] ?? '').trim() : '';
    });

    const errors = [];

    if (entityType === 'schools') {
      if (!mapped.school_name) errors.push('Missing School Name');
      if (!mapped.school_address) errors.push('Missing School Address');
      if (!mapped.at_post) errors.push('Missing At Post');
      if (!mapped.taluka) errors.push('Missing Taluka');
      if (!mapped.district) errors.push('Missing District');
      if (!isValidPinCode(mapped.pin_code)) errors.push('Invalid 6-digit PIN Code');
      if (!mapped.medium) errors.push('Missing Medium');
      if (!isValidSchoolPhone(mapped.school_phone)) errors.push('Invalid School Phone');
      if (!mapped.guidance_teacher_name) errors.push('Missing Guidance Teacher');
      if (!isValidIndianMobile(mapped.teacher_mobile, true)) errors.push('Invalid Teacher Mobile');

      const sig = `${mapped.school_name}|${mapped.taluka}|${mapped.district}|${mapped.medium}`.toLowerCase();
      if (seenInFile.has(sig)) errors.push('Duplicate row inside CSV file');
      seenInFile.add(sig);

      const dbDup = existingSchools.some(
        (s) => `${s.school_name}|${s.taluka}|${s.district}|${s.medium}`.toLowerCase() === sig
      );
      if (dbDup) errors.push('Already exists in database');

      validated.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        payload: {
          school_name: mapped.school_name,
          school_address: mapped.school_address,
          at_post: mapped.at_post,
          taluka: mapped.taluka,
          district: mapped.district,
          pin_code: mapped.pin_code,
          medium: mapped.medium,
          school_phone: mapped.school_phone,
          guidance_teacher_name: mapped.guidance_teacher_name,
          teacher_mobile: mapped.teacher_mobile,
          school_email: mapped.school_email || null,
        },
      });
    } else if (entityType === 'students') {
      if (!mapped.first_name) errors.push('Missing First Name');
      if (!mapped.father_name) errors.push("Missing Father's Name");
      if (!mapped.student_surname) errors.push('Missing Surname');
      if (mapped.parent_mobile && !isValidIndianMobile(mapped.parent_mobile, false)) {
        errors.push('Invalid Parent Mobile');
      }
      if (!mapped.standard) errors.push('Missing Standard');
      if (!mapped.medium) errors.push('Missing Medium');

      const matchedSchool = existingSchools.find(
        (s) => s.school_name.toLowerCase() === mapped.school_name.toLowerCase()
      );
      if (!matchedSchool) {
        errors.push(`School "${mapped.school_name}" not found in database`);
      }

      const fullName =
        mapped.student_name ||
        [mapped.first_name, mapped.father_name, mapped.student_surname].filter(Boolean).join(' ');

      const sig = `${mapped.first_name}|${mapped.father_name}|${mapped.student_surname}|${matchedSchool?.id || ''}|${mapped.standard}`.toLowerCase();
      if (seenInFile.has(sig)) errors.push('Duplicate student inside CSV file');
      seenInFile.add(sig);

      const dbDup = existingStudents.some(
        (st) =>
          `${st.first_name}|${st.father_name}|${st.student_surname}|${st.school_id}|${st.standard}`.toLowerCase() === sig
      );
      if (dbDup) errors.push('Student already registered in database');

      validated.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        payload: {
          student_name: fullName,
          first_name: mapped.first_name,
          father_name: mapped.father_name,
          student_surname: mapped.student_surname,
          parent_mobile: mapped.parent_mobile || null,
          school_id: matchedSchool?.id || null,
          school_name: matchedSchool?.school_name || mapped.school_name,
          standard: mapped.standard,
          medium: mapped.medium,
          academic_year: mapped.academic_year || '2026-27',
          counselor_name: mapped.counselor_name || null,
          exam_center: mapped.exam_center || null,
          gender: ['Male', 'Female', 'Other'].includes(mapped.gender) ? mapped.gender : null,
          date_of_birth: mapped.date_of_birth || null,
          student_address: mapped.student_address || null,
        },
      });
    } else if (entityType === 'examinations') {
      const matchedStudent = existingStudents.find(
        (st) =>
          (mapped.student_form_number &&
            st.form_number.toLowerCase() === mapped.student_form_number.toLowerCase()) ||
          (st.student_name.toLowerCase() === mapped.student_name.toLowerCase() &&
            st.school_name.toLowerCase() === mapped.school_name.toLowerCase())
      );

      if (!matchedStudent) {
        errors.push(`Student "${mapped.student_name}" not found in registered students`);
      }

      const calc = calculateTwoSubjectResult({
        subject1Marks: mapped.subject_1_marks,
        subject2Marks: mapped.subject_2_marks,
        standard: matchedStudent?.standard || '4th',
        resultOptions,
      });

      const s1 = Number(mapped.subject_1_marks);
      const s2 = Number(mapped.subject_2_marks);

      if (mapped.subject_1_marks === '' || isNaN(s1) || s1 < 0 || s1 > calc.sub1Max) {
        errors.push(`Subject 1 marks must be 0 - ${calc.sub1Max}`);
      }
      if (mapped.subject_2_marks === '' || isNaN(s2) || s2 < 0 || s2 > calc.sub2Max) {
        errors.push(`Subject 2 marks must be 0 - ${calc.sub2Max}`);
      }

      validated.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        payload: {
          student_id: matchedStudent?.id || null,
          student_name: matchedStudent?.student_name || mapped.student_name,
          school_id: matchedStudent?.school_id || null,
          school_name: matchedStudent?.school_name || mapped.school_name,
          standard: matchedStudent?.standard || '',
          medium: matchedStudent?.medium || '',
          subject_1_max_marks: calc.sub1Max,
          subject_2_max_marks: calc.sub2Max,
          subject_1_marks: s1 || 0,
          subject_2_marks: s2 || 0,
          subject_3_marks: 0,
          subject_4_marks: 0,
          subject_5_marks: 0,
          total_marks: calc.totalMarks,
          obtained_marks: calc.obtainedMarks,
          percentage: calc.percentage,
          result_option_id: calc.resultOptionId,
          result_status: calc.resultStatus,
          remarks: mapped.remarks || null,
        },
      });
    }
  });

  return validated;
}

export async function commitValidCsvRows(entityType, fileName, validatedRows, userId) {
  const validPayloads = validatedRows
    .filter((r) => r.isValid)
    .map((r) => ({ ...r.payload, created_by: userId || null }));

  const rejectedRows = validatedRows
    .filter((r) => !r.isValid)
    .map((r) => ({ row: r.rowNumber, errors: r.errors }));

  if (validPayloads.length > 0) {
    const { error } = await supabase.from(entityType).insert(validPayloads);
    if (error) throw error;
  }

  await supabase.from('csv_import_logs').insert([
    {
      entity_type: entityType,
      file_name: fileName,
      total_rows: validatedRows.length,
      imported_rows: validPayloads.length,
      rejected_rows: rejectedRows.length,
      error_summary: rejectedRows,
      imported_by: userId || null,
    },
  ]);

  return {
    importedCount: validPayloads.length,
    rejectedCount: rejectedRows.length,
  };
}

export async function getRecentImportLogs() {
  const { data, error } = await supabase
    .from('csv_import_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}