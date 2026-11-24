import { supabase } from '../lib/supabaseClient';

const DEFAULT_SUBJECT_NAMES = [
  'Subject 1 (Language I)',
  'Subject 2 (Language II)',
  'Subject 3 (Mathematics)',
  'Subject 4 (Science)',
  'Subject 5 (Social Studies)',
];

export async function getExaminations({
  search = '',
  schoolId = '',
  standard = '',
  medium = '',
  resultStatus = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 1,
  pageSize = 10,
} = {}) {
  let query = supabase
    .from('examinations')
    .select('*, result_options(badge_color, is_passing), students(form_number)', {
      count: 'exact',
    });

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `student_name.ilike.%${term}%,school_name.ilike.%${term}%,result_status.ilike.%${term}%`
    );
  }

  if (schoolId) query = query.eq('school_id', schoolId);
  if (standard) query = query.eq('standard', standard);
  if (medium) query = query.eq('medium', medium);
  if (resultStatus) query = query.eq('result_status', resultStatus);

  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

async function syncNormalizedSubjects(examId, payload) {
  const marks = [
    payload.subject_1_marks,
    payload.subject_2_marks,
    payload.subject_3_marks,
    payload.subject_4_marks,
    payload.subject_5_marks,
  ];
  const maxMarks = Number(payload.max_marks_per_subject) || 100;

  const subjectRows = marks.map((m, idx) => ({
    examination_id: examId,
    subject_number: idx + 1,
    subject_name: DEFAULT_SUBJECT_NAMES[idx],
    max_marks: maxMarks,
    obtained_marks: Number(m) || 0,
  }));

  const { error } = await supabase
    .from('examination_subjects')
    .upsert(subjectRows, { onConflict: 'examination_id,subject_number' });

  if (error) throw error;
}

export async function createExamination(payload, userId) {
  const { data, error } = await supabase
    .from('examinations')
    .insert([
      {
        ...payload,
        created_by: userId || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An examination record already exists for this student and exam.');
    }
    throw error;
  }

  await syncNormalizedSubjects(data.id, payload);
  return data;
}

export async function updateExamination(id, payload) {
  const { data, error } = await supabase
    .from('examinations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await syncNormalizedSubjects(id, payload);
  return data;
}

export async function deleteExamination(id) {
  const { error } = await supabase.from('examinations').delete().eq('id', id);
  if (error) throw error;
}