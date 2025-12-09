import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
// As chaves devem ser configuradas via Variáveis de Ambiente ou no painel do Supabase.
// Não cole credenciais reais (Google Client ID/Secret) diretamente neste arquivo para evitar bloqueios do GitHub.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eclxjggicyfqjpgeytjk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cmn9QMMw2Un1yACYWwUaWQ_kdHcrmwm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
