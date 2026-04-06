import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const testSupabaseUpdate = async () => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'schema_cln_001' }
  })

  console.log('--- TESTANDO UPDATE NA TABELA appointments ---')
  
  // 1. Busca um ID para testar
  const { data: appts, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, bot_paused')
    .limit(1)

  if (fetchErr || !appts || appts.length === 0) {
     console.error('❌ ERRO ao buscar agendamento:', fetchErr?.message || 'Nenhum agendamento encontrado')
     return;
  }

  const targetAppt = appts[0]
  console.log(`Encontrado: ID ${targetAppt.id}, bot_paused atual: ${targetAppt.bot_paused}`)

  // 2. Tenta fazer o update
  const novoStatus = !targetAppt.bot_paused
  console.log(`Tentando atualizar bot_paused para: ${novoStatus}`)

  const { data, error, status } = await supabase
    .from('appointments')
    .update({ bot_paused: novoStatus })
    .eq('id', targetAppt.id)
    .select() // É IMPORTANTE colocar .select() no final do update do supabase-js para ele retornar os dados alterados, senão ele não levanta erros RLS as vezes.

  if (error) {
    console.error('❌ ERRO NO UPDATE:', error)
  } else {
    console.log(`✅ SUCESSO! Response Status: ${status}`)
    console.log('Dados atualizados:', data)
    
    if (data && data.length === 0) {
      console.log('⚠️ A query executou, mas não atualizou nenhuma linha. Provavelmente problema de permissão (RLS) ou ID não encontrado.')
    }
  }
}

testSupabaseUpdate()
