import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ctmelhedolmooplztksj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YrUVBrxkWBNlFwo268WjTQ_mhwRNTFZ';

export const supabase = createClient(supabaseUrl, supabaseKey);