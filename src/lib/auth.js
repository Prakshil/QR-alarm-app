import { supabase } from './supabase';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function resetPassword(email, redirectTo = 'qralarmapp://auth-callback') {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}

export async function resendConfirmation(email) {
  if (!email) throw new Error('Email required');
  // Supabase v2: resend magic link or confirmation
  const { data, error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
  return data;
}
