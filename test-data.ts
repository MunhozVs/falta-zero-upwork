import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const testSupabase = async () => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'schema_cln_001' }
  })

  console.log('--- BUSCANDO AGENDAMENTOS EM schema_cln_001.appointments ---')
  
  const { data, error, count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })

  if (error) {
    console.error('❌ ERRO:', error.message)
  } else {
    console.log(`✅ SUCESSO! Encontrados ${data?.length} registros.`)
    if (data && data.length > 0) {
      console.log('Primeiro registro:', data[0])
    } else {
      console.log('⚠️ A tabela está acessível, mas retornou VAZIO (0 registros).')
      console.log('Dica: Verifique se o Row Level Security (RLS) está ativado e se há uma política de SELECT para o role anon.')
    }
  }
}

testSupabase()
