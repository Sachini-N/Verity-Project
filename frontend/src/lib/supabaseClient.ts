import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmlybjstdnrfmkanvuze.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbHlianN0ZG5yZm1rYW52dXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzkwMDQsImV4cCI6MjA4OTkxNTAwNH0.r1rJ1-KKS6J_r-_IBlMVNBxAFAv3uajE3VXkvg32104';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
