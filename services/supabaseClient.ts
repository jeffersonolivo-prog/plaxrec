import { createClient } from '@supabase/supabase-js';

// Função segura para acessar variáveis de ambiente sem quebrar no navegador
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Configuração do cliente Supabase
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://eclxjggicyfqjpgeytjk.supabase.co';
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'sb_publishable_cmn9QMMw2Un1yACYWwUaWQ_kdHcrmwm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
