import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const testSupabase = async () => {
  console.log('--- TESTE DE CONEXÃO SUPABASE MULTI-SCHEMA ---')
  console.log(`URL: ${supabaseUrl}`)
  console.log('Schema: schema_cln_001\n')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'schema_cln_001' }
  })

  const checkTable = async (tableName: string) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
       console.error(`❌ ERRO EM "${tableName}": ${error.code} - ${error.message}`)
    } else {
      console.log(`✅ SUCESSO EM "${tableName}"! Acessível.`)
    }
  }

  await checkTable('clinic_config')
  await checkTable('Clinic_Config')
  await checkTable('appointments')
  await checkTable('Appointments')
  await checkTable('waitlist')
  await checkTable('Waitlist')
}

testSupabase()
