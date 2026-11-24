import { supabase } from '../lib/supabaseClient';

export async function getSchools({
  search = '',
  district = '',
  taluka = '',
  standard = '',
  medium = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 1,
  pageSize = 10,
} = {}) {
  let query = supabase
    .from('schools')
    .select('*', { count: 'exact' });

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `form_number.ilike.%${term}%,school_name.ilike.%${term}%,guidance_teacher_name.ilike.%${term}%,teacher_mobile.ilike.%${term}%,district.ilike.%${term}%,taluka.ilike.%${term}%`
    );
  }

  if (district) query = query.eq('district', district);
  if (taluka) query = query.eq('taluka', taluka);
  if (standard) query = query.eq('standard', standard);
  if (medium) query = query.eq('medium', medium);

  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

export async function getAllSchoolsDropdown() {
  const { data, error } = await supabase
    .from('schools')
    .select('id, form_number, school_name, standard, medium, district, taluka')
    .order('school_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSchoolFilterOptions() {
  const { data, error } = await supabase
    .from('schools')
    .select('district, taluka, standard, medium');

  if (error) throw error;
  const rows = data || [];

  return {
    districts: [...new Set(rows.map((r) => r.district).filter(Boolean))].sort(),
    talukas: [...new Set(rows.map((r) => r.taluka).filter(Boolean))].sort(),
    standards: [...new Set(rows.map((r) => r.standard).filter(Boolean))].sort(),
    mediums: [...new Set(rows.map((r) => r.medium).filter(Boolean))].sort(),
  };
}

export async function createSchool(payload, userId) {
  const { data, error } = await supabase
    .from('schools')
    .insert([
      {
        ...payload,
        form_number: payload.form_number?.trim() || '', // Triggers SCH-1001 auto-generation
        created_by: userId || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A school with the same name, taluka, district, standard, and medium already exists.');
    }
    throw error;
  }
  return data;
}

export async function updateSchool(id, payload) {
  const { data, error } = await supabase
    .from('schools')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Duplicate school entry detected for this standard and medium.');
    }
    throw error;
  }
  return data;
}

export async function deleteSchool(id) {
  const { error } = await supabase.from('schools').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Cannot delete this school because students are currently registered under it.');
    }
    throw error;
  }
}