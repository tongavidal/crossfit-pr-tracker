import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sustituye estos dos valores por los de tu proyecto Supabase.
const SUPABASE_URL = 'https://supabase.com/dashboard/project/zpgqlpisnvekqrtvilya';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qWWOYAHfIFMOI_F1Po_JIA_qPFNM_mB';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

