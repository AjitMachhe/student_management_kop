import { supabase } from '../lib/supabaseClient';

export async function getStudents({
  search = '',
  schoolId = '',
  standard = '',
  medium = '',
  district = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 1,
  pageSize = 10,
} = {}) {
  // Join schools so we can filter by district seamlessly
  let query = supabase
    .from('students')
    .select('*, schools!inner(district, taluka, form_number)', { count: 'exact' });

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `form_number.ilike.%${term}%,student_name.ilike.%${term}%,student_surname.ilike.%${term}%,first_name.ilike.%${term}%,school_name.ilike.%${term}%,parent_mobile.ilike.%${term}%`
    );
  }

  if (schoolId) query = query.eq('school_id', schoolId);
  if (standard) query = query.eq('standard', standard);
  if (medium) query = query.eq('medium', medium);
  if (district) query = query.eq('schools.district', district);

  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

export async function getAllStudentsDropdown() {
  const { data, error } = await supabase
    .from('students')
    .select('id, form_number, student_name, school_id, school_name, standard, medium')
    .order('student_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function uploadParentSignature(file) {
  if (!file) return null;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Parent signature must be JPG, PNG, WEBP, or PDF.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Signature file size must be under 2 MB.');
  }

  const ext = file.name.split('.').pop();
  const filePath = `signatures/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('parent-signatures')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('parent-signatures')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function checkDuplicateStudent({
  first_name,
  father_name,
  student_surname,
  school_id,
  standard,
  excludeId = null,
}) {
  let query = supabase
    .from('students')
    .select('id, form_number')
    .ilike('first_name', first_name.trim())
    .ilike('father_name', father_name.trim())
    .ilike('student_surname', student_surname.trim())
    .eq('school_id', school_id)
    .eq('standard', standard);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).length > 0 ? data[0] : null;
}

export async function createStudent(payload, signatureFile, userId) {
  // Proactive duplicate check before insert
  const duplicate = await checkDuplicateStudent(payload);
  if (duplicate) {
    throw new Error(
      `Duplicate record prevented: "${payload.student_name}" is already registered in this school & standard (${duplicate.form_number}).`
    );
  }

  let signatureUrl = payload.parent_signature_url || null;
  if (signatureFile) {
    signatureUrl = await uploadParentSignature(signatureFile);
  }

  const { data, error } = await supabase
    .from('students')
    .insert([
      {
        ...payload,
        form_number: payload.form_number?.trim() || '', // Auto-generates STU-10001
        parent_signature_url: signatureUrl,
        created_by: userId || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Duplicate student record already exists in this school and standard.');
    }
    throw error;
  }
  return data;
}

export async function updateStudent(id, payload, signatureFile) {
  const duplicate = await checkDuplicateStudent({ ...payload, excludeId: id });
  if (duplicate) {
    throw new Error(
      `Duplicate record prevented: Another student with the exact same name exists in this school (${duplicate.form_number}).`
    );
  }

  let signatureUrl = payload.parent_signature_url;
  if (signatureFile) {
    signatureUrl = await uploadParentSignature(signatureFile);
  }

  const { data, error } = await supabase
    .from('students')
    .update({
      ...payload,
      parent_signature_url: signatureUrl,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}