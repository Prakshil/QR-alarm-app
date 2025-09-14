import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials (provided by user)
const SUPABASE_URL = 'https://bkkqqnlphkflecbavfww.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra3FxbmxwaGtmbGVjYmF2Znd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzk4NzgsImV4cCI6MjA3MzQxNTg3OH0.R4Lhn1Yt1BdbmsPYGvj9vgz3Im5X57aNF2BsNkOgULM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Optional helpers can be added here later (e.g., createProfile, verifyQrByCode)
