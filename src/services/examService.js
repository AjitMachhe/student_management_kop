import { supabase } from '../lib/supabaseClient';

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
    .select(
      '*, result_options(badge_color, is_passing), students(form_number, academic_year, counselor_name, exam_center, parent_mobile)',
      { count: 'exact' }
    );

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

async function syncNormalizedTwoSubjects(examId, payload) {
  await supabase.from('examination_subjects').delete().eq('examination_id', examId);

  const subjectRows = [
    {
      examination_id: examId,
      subject_number: 1,
      subject_name: payload.subject_1_name || 'Marathi & Mathematics',
      max_marks: Number(payload.subject_1_max_marks) || 100,
      obtained_marks: Number(payload.subject_1_marks) || 0,
    },
    {
      examination_id: examId,
      subject_number: 2,
      subject_name: payload.subject_2_name || 'English & Intelligence',
      max_marks: Number(payload.subject_2_max_marks) || 100,
      obtained_marks: Number(payload.subject_2_marks) || 0,
    },
  ];

  const { error } = await supabase.from('examination_subjects').insert(subjectRows);
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

  await syncNormalizedTwoSubjects(data.id, payload);
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

  await syncNormalizedTwoSubjects(id, payload);
  return data;
}

export async function deleteExamination(id) {
  const { error } = await supabase.from('examinations').delete().eq('id', id);
  if (error) throw error;
}