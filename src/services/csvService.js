import Papa from 'papaparse';
import { supabase } from '../lib/supabaseClient';
import { isValidIndianMobile, isValidPinCode, isValidSchoolPhone } from '../utils/validators';
import { calculateExamResult } from '../utils/gradeCalculator';

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
      { key: 'standard', label: 'Standard', required: true, aliases: ['standard', 'std', 'class'] },
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
      { key: 'parent_mobile', label: 'Parent Mobile', required: true, aliases: ['parent mobile', 'mobile', 'phone', 'contact'] },
      { key: 'school_name', label: 'School Name (Exact Match)', required: true, aliases: ['school name', 'school'] },
      { key: 'standard', label: 'Standard', required: true, aliases: ['standard', 'std', 'class'] },
      { key: 'medium', label: 'Medium', required: true, aliases: ['medium'] },
      { key: 'gender', label: 'Gender', required: false, aliases: ['gender', 'sex'] },
      { key: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)', required: false, aliases: ['dob', 'date of birth', 'birth date'] },
      { key: 'student_address', label: 'Student Address', required: false, aliases: ['address', 'student address'] },
    ],
  },
  examinations: {
    label: 'Examination Results',
    fields: [
      { key: 'student_form_number', label: 'Student Form No. (or Name)', required: false, aliases: ['form number', 'form no', 'student id'] },
      { key: 'student_name', label: 'Student Full Name', required: true, aliases: ['student name', 'name'] },
      { key: 'school_name', label: 'School Name', required: true, aliases: ['school name', 'school'] },
      { key: 'subject_1_marks', label: 'Subject 1 Marks', required: true, aliases: ['subject 1', 'sub1', 'marks 1'] },
      { key: 'subject_2_marks', label: 'Subject 2 Marks', required: true, aliases: ['subject 2', 'sub2', 'marks 2'] },
      { key: 'subject_3_marks', label: 'Subject 3 Marks', required: true, aliases: ['subject 3', 'sub3', 'marks 3'] },
      { key: 'subject_4_marks', label: 'Subject 4 Marks', required: true, aliases: ['subject 4', 'sub4', 'marks 4'] },
      { key: 'subject_5_marks', label: 'Subject 5 Marks', required: true, aliases: ['subject 5', 'sub5', 'marks 5'] },
      { key: 'remarks', label: 'Remarks', required: false, aliases: ['remarks', 'comment'] },
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
    supabase.from('schools').select('id, school_name, taluka, district, standard, medium'),
    supabase.from('students').select('id, form_number, first_name, father_name, student_surname, student_name, school_id, school_name, standard, medium'),
    supabase.from('result_options').select('*').order('display_order', { ascending: true }),
  ]);

  const existingSchools = schoolsRes.data || [];
  const existingStudents = studentsRes.data || [];
  const resultOptions = resultOptsRes.data || [];

  const seenInFile = new Set();
  const validated = [];

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header row
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
      if (!mapped.standard) errors.push('Missing Standard');
      if (!mapped.medium) errors.push('Missing Medium');
      if (!isValidSchoolPhone(mapped.school_phone)) errors.push('Invalid School Phone');
      if (!mapped.guidance_teacher_name) errors.push('Missing Guidance Teacher');
      if (!isValidIndianMobile(mapped.teacher_mobile)) errors.push('Invalid Teacher Mobile');

      const sig = `${mapped.school_name}|${mapped.taluka}|${mapped.district}|${mapped.standard}|${mapped.medium}`.toLowerCase();
      if (seenInFile.has(sig)) errors.push('Duplicate row inside CSV file');
      seenInFile.add(sig);

      const dbDup = existingSchools.some(
        (s) =>
          `${s.school_name}|${s.taluka}|${s.district}|${s.standard}|${s.medium}`.toLowerCase() === sig
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
          standard: mapped.standard,
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
      if (!isValidIndianMobile(mapped.parent_mobile)) errors.push('Invalid Parent Mobile');
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
          parent_mobile: mapped.parent_mobile,
          school_id: matchedSchool?.id || null,
          school_name: matchedSchool?.school_name || mapped.school_name,
          standard: mapped.standard,
          medium: mapped.medium,
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

      const marks = [
        mapped.subject_1_marks,
        mapped.subject_2_marks,
        mapped.subject_3_marks,
        mapped.subject_4_marks,
        mapped.subject_5_marks,
      ];

      if (marks.some((m) => m === '' || isNaN(Number(m)) || Number(m) < 0 || Number(m) > 100)) {
        errors.push('All 5 subjects must have numeric marks between 0 and 100');
      }

      const calc = calculateExamResult(marks, 100, resultOptions);

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
          subject_1_marks: Number(marks[0]) || 0,
          subject_2_marks: Number(marks[1]) || 0,
          subject_3_marks: Number(marks[2]) || 0,
          subject_4_marks: Number(marks[3]) || 0,
          subject_5_marks: Number(marks[4]) || 0,
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

  // Persist audit log in csv_import_logs
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