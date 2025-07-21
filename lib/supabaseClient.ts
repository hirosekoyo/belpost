import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://isqzroqysdxdxacykyop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzcXpyb3F5c2R4ZHhhY3lreW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTU0MTcsImV4cCI6MjA2ODE5MTQxN30.Qq0xgqUieXqhFeY_NOQah1fvtoVPY9Hss5DiGfC2zOw';
export const supabase = createClient(supabaseUrl, supabaseKey); 