import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL e Anon Key não configurados no .env');
}

const clients: Record<string, any> = {};

/**
 * Cria/Recupera um cliente Supabase configurado para um schema específico (Singleton por schema).
 */
export function getClinicClient(schema: string = 'public') {
  if (!clients[schema]) {
    clients[schema] = createClient(supabaseUrl, supabaseKey, {
      db: { schema: schema },
    });
  }
  return clients[schema];
}

// Cliente padrão (schema public)
export const supabase = createClient(supabaseUrl, supabaseKey);
