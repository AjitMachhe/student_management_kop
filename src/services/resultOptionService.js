import { supabase } from '../lib/supabaseClient';

export async function getResultOptions() {
  const { data, error } = await supabase
    .from('result_options')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createResultOption(payload) {
  const { count, error: countErr } = await supabase
    .from('result_options')
    .select('*', { count: 'exact', head: true });

  if (countErr) throw countErr;
  if ((count || 0) >= 12) {
    throw new Error('Maximum 12 result options are supported. Edit or remove an existing option first.');
  }

  const { data, error } = await supabase
    .from('result_options')
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Result option code or label already exists.');
    }
    throw error;
  }
  return data;
}

export async function updateResultOption(id, payload) {
  const { data, error } = await supabase
    .from('result_options')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResultOption(id) {
  const { error } = await supabase.from('result_options').delete().eq('id', id);
  if (error) throw error;
}