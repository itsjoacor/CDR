import { createClient } from '@supabase/supabase-js';
const supabaseUrl = "https://gdypwttbnnqcscuntpeb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkeXB3dHRibm5xY3NjdW50cGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDYwMDUsImV4cCI6MjA2MzMyMjAwNX0.2bmwPfjTul-5pDbLI_lxqYsH-U_ISI8oZiFp4dIpFhg";
export const supabase = createClient(supabaseUrl, supabaseKey);