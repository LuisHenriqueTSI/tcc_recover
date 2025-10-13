import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiegfwnlphfblvzupziu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZWdmd25scGhmYmx2enVweml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM1MzQ4NCwiZXhwIjoyMDc1OTI5NDg0fQ.xFS8s7xpoHkJP8f-2uKhPMHOBOQhXJ7qZGUJOosKePU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
