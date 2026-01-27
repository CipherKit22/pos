import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ctmelhedolmooplztksj.supabase.co';
const supabaseKey = 'sb_publishable_YrUVBrxkWBNlFwo268WjTQ_mhwRNTFZ';

export const supabase = createClient(supabaseUrl, supabaseKey);