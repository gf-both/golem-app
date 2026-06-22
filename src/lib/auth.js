import { supabase } from './supabase';

export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  return { data, error };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  return { data, error };
}

export async function signOut() {
  const res = await supabase.auth.signOut();
  // Clear the local cache so a shared device leaks nothing between accounts.
  try { localStorage.removeItem('golem-store'); } catch { /* ignore */ }
  return res;
}

export async function resetPassword(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
}

// GDPR: delete the current user's account and all owned data (cascades).
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_own_account');
  if (!error) {
    try { localStorage.removeItem('golem-store'); } catch { /* ignore */ }
    await supabase.auth.signOut();
  }
  return { error };
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
