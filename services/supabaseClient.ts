import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DE PRODUÇÃO ---
// Para sair do modo DEMO e fazer o login funcionar, você deve:
// 1. Ir no painel do Supabase > Project Settings > API.
// 2. Copiar a "Project URL" e a "anon public key".
// 3. Colar abaixo substituindo as strings vazias ou de exemplo.

export const SUPABASE_URL = 'COLE_SUA_URL_DO_SUPABASE_AQUI'; // Ex: https://xyz.supabase.co
export const SUPABASE_ANON_KEY = 'COLE_SUA_ANON_KEY_AQUI';   // Ex: eyJhbGciOiJIUzI1NiIsInR...

// --- VALIDAÇÃO DE SEGURANÇA (Evita tela branca) ---
// Verifica se a URL é válida para não quebrar a execução do Javascript

const isUrlValid = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

const hasValidConfig = isUrlValid(SUPABASE_URL) && !SUPABASE_URL.includes('COLE_SUA') && !SUPABASE_ANON_KEY.includes('COLE_SUA');

if (!hasValidConfig) {
    console.warn("⚠️ AVISO PLAXREC: As chaves do Supabase não estão configuradas corretamente em services/supabaseClient.ts. O app carregará, mas a conexão falhará.");
}

// Se a configuração for inválida, usamos valores "dummy" seguros para que o createClient não lance uma exceção fatal.
// Isso permite que o App abra e mostre a tela de erro para o usuário corrigir, em vez de ficar uma tela branca.
const safeUrl = hasValidConfig ? SUPABASE_URL : 'https://placeholder.supabase.co';
const safeKey = hasValidConfig ? SUPABASE_ANON_KEY : 'placeholder';

export const supabase = createClient(safeUrl, safeKey);
