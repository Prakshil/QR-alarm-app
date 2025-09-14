import { supabase } from './supabase';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password
  });
  
  if (error) {
    console.log('SignUp Error:', error);
    throw error;
  }
  
  console.log('SignUp Success:', data);
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.log('SignIn Error:', error);
    throw error;
  }
  
  console.log('SignIn Success:', data);
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

export async function resetPassword(email) {
  // For web/localhost development, use localhost URL
  // For production, this should be your app's domain
  const redirectTo = 'http://localhost:3000/reset-password';
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}


