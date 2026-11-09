import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sustituye estos dos valores por los de tu proyecto Supabase.
const SUPABASE_URL = 'PEGA_AQUI_TU_PROJECT_URL';
const SUPABASE_PUBLISHABLE_KEY = 'PEGA_AQUI_TU_PUBLISHABLE_KEY';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

