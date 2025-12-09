import { createClient } from '@supabase/supabase-js';

// Use environment variables or your actual Supabase credentials.
// The fallback URL must be syntactically valid (starts with https://) to avoid the "Failed to construct 'URL': Invalid URL" error.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eclxjggicyfqjpgeytjk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cmn9QMMw2Un1yACYWwUaWQ_kdHcrmwm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * --- INSTRUÇÕES IMPORTANTES DE CONFIGURAÇÃO ---
 * 
 * 1. EMAIL CONFIRMATION:
 *    Se você receber o erro "Email not confirmed", vá no Painel do Supabase -> Authentication -> Providers -> Email
 *    e DESMARQUE a opção "Confirm email". Salve.
 * 
 * 2. DATABASE SCHEMA:
 * 
 * Copie o código SQL abaixo e execute no SQL Editor do Supabase para criar as tabelas necessárias:
 * 
 * -- 1. Tabelas
 * create extension if not exists "uuid-ossp";
 * 
 * create table public.profiles (
 *   id uuid references auth.users not null primary key,
 *   email text,
 *   name text,
 *   role text check (role in ('COLETOR', 'RECICLADOR', 'TRANSFORMADOR', 'COMPRADOR_ESG', 'ADMIN')),
 *   balance_plax float default 0,
 *   balance_brl float default 0,
 *   locked_plax float default 0,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * create table public.batches (
 *   id uuid default uuid_generate_v4() primary key,
 *   collector_id uuid references public.profiles(id),
 *   recycler_id uuid references public.profiles(id),
 *   weight_kg float not null,
 *   plastic_type text,
 *   plax_generated float,
 *   status text default 'RECEIVED',
 *   nfe_id text,
 *   certified_by_user_id uuid references public.profiles(id),
 *   certification_date timestamp with time zone,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * create table public.transactions (
 *   id uuid default uuid_generate_v4() primary key,
 *   from_user_id uuid references public.profiles(id),
 *   to_user_id uuid references public.profiles(id),
 *   type text,
 *   amount_plax float default 0,
 *   amount_brl float default 0,
 *   description text,
 *   status text default 'COMPLETED',
 *   date timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- 2. Trigger para criar usuário automaticamente
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, email, name, role, balance_plax, balance_brl, locked_plax)
 *   values (
 *     new.id,
 *     new.email,
 *     coalesce(new.raw_user_meta_data->>'name', 'Novo Usuário'),
 *     coalesce(new.raw_user_meta_data->>'role', 'COLETOR'),
 *     0, 0, 0
 *   );
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * drop trigger if exists on_auth_user_created on auth.users;
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 * 
 * -- 3. Permissões (RLS) - Simples para MVP
 * alter table public.profiles enable row level security;
 * alter table public.batches enable row level security;
 * alter table public.transactions enable row level security;
 * 
 * create policy "Public Access Profiles" on public.profiles for all using (true);
 * create policy "Public Access Batches" on public.batches for all using (true);
 * create policy "Public Access Transactions" on public.transactions for all using (true);
 */