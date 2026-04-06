import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const testSupabaseView = async () => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'schema_cln_001' }
  })

  // 1. Busca um ID para testar
  const { data: appts, error: fetchErr } = await supabase
    .from('appointments')
    .select('*')
    .limit(1)

  console.log(appts)
}

testSupabaseView()
