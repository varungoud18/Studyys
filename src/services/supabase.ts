import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = !rawUrl || !rawKey || rawUrl.includes('placeholder') || !rawUrl.startsWith('https://');

if (isPlaceholder) {
  console.warn(
    'Supabase environment variables are missing or using placeholder values. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Use a valid dummy URL to prevent createClient from throwing a fatal validation error on startup
const finalUrl = isPlaceholder ? 'https://placeholder-project.supabase.co' : rawUrl;
const finalKey = isPlaceholder ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy' : rawKey;

export const supabase = createClient(finalUrl, finalKey);
