import { supabase } from '../lib/supabaseClient';

export async function getOrganizationSettings() {
  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function uploadBrandingAsset(file, folder = 'logos') {
  if (!file) return null;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Image must be PNG, JPG, or WEBP.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size must be under 2 MB.');
  }

  const ext = file.name.split('.').pop();
  const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('parent-signatures')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('parent-signatures')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function updateOrganizationSettings(id, payload, logoFile = null, signatureFile = null) {
  let logoUrl = payload.logo_url;
  let signatureUrl = payload.controller_signature_url;

  if (logoFile) {
    logoUrl = await uploadBrandingAsset(logoFile, 'logos');
  }
  if (signatureFile) {
    signatureUrl = await uploadBrandingAsset(signatureFile, 'controller-signatures');
  }

  const { data, error } = await supabase
    .from('organization_settings')
    .update({
      ...payload,
      logo_url: logoUrl,
      controller_signature_url: signatureUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}