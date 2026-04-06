import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const testSupabaseView = async () => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'schema_cln_001' }
  })

  const { data, error } = await supabase
    .from('clinic_config')
    .select('*')
    .limit(1)

  console.log(data ? Object.keys(data[0]) : error)
}

testSupabaseView()
