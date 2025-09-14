import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Supabase project credentials (provided by user)
const SUPABASE_URL = 'https://bkkqqnlphkflecbavfww.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra3FxbmxwaGtmbGVjYmF2Znd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzk4NzgsImV4cCI6MjA3MzQxNTg3OH0.R4Lhn1Yt1BdbmsPYGvj9vgz3Im5X57aNF2BsNkOgULM';

// Create a custom storage adapter that works on web and native
const customStorage = {
  getItem: (key) => {
    if (Platform.OS === 'web') {
      // Use localStorage on web, but check if it's available (SSR safe)
      if (typeof window !== 'undefined' && window.localStorage) {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: customStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
		flowType: 'pkce', // Use PKCE flow for better mobile support
	},
});

// Optional helpers can be added here later (e.g., createProfile, verifyQrByCode)
