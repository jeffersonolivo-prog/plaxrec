import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DIRETA (RESOLUÇÃO NA FONTE)
// ------------------------------------------------------------------

export const SUPABASE_URL = 'https://eclxjggicyfqjpgeytjk.supabase.co'; 
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbHhqZ2dpY3lmcWpwZ2V5dGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNTI2MjcsImV4cCI6MjA4MDgyODYyN30.R3odqxLo6w-PCXnIrtZyvBmuUqzvl1AwRMugTE0k-uQ';

// Verificação de segurança simples
const isValidUrl = (url: string) => {
    try { return !!new URL(url); } catch { return false; }
};

const urlToUse = isValidUrl(SUPABASE_URL) ? SUPABASE_URL : 'https://placeholder.supabase.co';
// Cast to string to prevent TypeScript error about disjoint types comparison
const keyToUse = (SUPABASE_ANON_KEY as string) !== 'COLE_SUA_KEY_AQUI' ? SUPABASE_ANON_KEY : 'placeholder';

export const supabase = createClient(urlToUse, keyToUse);