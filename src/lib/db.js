import { getUserId } from './auth';
import { supabase } from './supabase';

export async function createProfileRow(name, qr_code) {
  const user_id = await getUserId();
  if (!user_id) throw new Error('Please sign in first.');
  const row = { name, qr_code, user_id };
  const { error } = await supabase.from('profiles').insert([row]);
  if (error) throw error;
  return row;
}

export async function verifyQr(code) {
  const { data, error } = await supabase.functions.invoke('verify-qr', {
    body: { qr_code: code },
  });
  if (error) throw error;
  return data?.valid ? data.profile || {} : null;
}
