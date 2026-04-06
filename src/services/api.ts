import { getClinicClient } from '../lib/supabaseClient';

export interface ServicePatient {
  id: string; // no banco pode ser id (uuid) ou phone
  name: string;
  phone?: string;
  appointment_datetime?: string;
  exam_type: string;
  status: string;
  human_required_flag?: boolean;
  bot_paused?: boolean;
  priority?: string;
  last_msg?: string; // se houver na tabela de logs ou se pegarmos do context
}

/**
 * Busca os agendamentos do dia atual para uma clínica específica.
 */
export async function fetchDailyAppointments(schema: string) {
  const supabase = getClinicClient(schema);
  
  // No mundo real, filtraríamos por data >= hoje 00:00 e <= hoje 23:59
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_datetime', now)
    .order('appointment_datetime', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Busca a lista de espera.
 */
export async function fetchWaitlist(schema: string) {
  const supabase = getClinicClient(schema);
  
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('priority', { ascending: false }) // se for numérico
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Busca casos que requerem intervenção humana.
 */
export async function fetchHumanInterventions(schema: string) {
  const supabase = getClinicClient(schema);
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('human_required_flag', true)
    .order('appointment_datetime', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Atualiza o status do robô (pausar/retomar).
 */
export async function toggleBotPausa(schema: string, appointmentId: string, paused: boolean) {
  const supabase = getClinicClient(schema);
  
  const { data, error } = await supabase
    .from('appointments')
    .update({ bot_paused: paused })
    .eq('id', appointmentId);

  if (error) throw error;
  return data;
}

/**
 * Aciona o webhook do n8n para cancelar o agendamento.
 */
export async function cancelAppointmentWebhook(payload: any) {
  const response = await fetch('https://n8n.zerofalta.com/webhook/cancela-via-dashboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([payload])
  });

  if (!response.ok) {
    throw new Error('Falha HTTP ao disparar webhook de cancelamento');
  }

  return true;
}

/**
 * Busca a configuração da clínica (ID do Chatwoot, etc).
 */
export async function fetchClinicConfig(schema: string) {
  const supabase = getClinicClient(schema);
  const { data, error } = await supabase
    .from('clinic_config')
    .select('chatwoot_account_id')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Aciona o webhook do n8n para enviar lembrete manual.
 */
export async function sendReminderWebhook(schema: string, patient: any, template: string) {
  const supabase = getClinicClient(schema);
  
  // Como o schema já representa a clínica, vamos pegar o único (ou com base no ID)
  // Utilizaremos un single() sabendo que há 1 register ou com eq() pra segurança
  const { data: configData, error } = await supabase
    .from('clinic_config')
    .select('wa_phone_number_id, wa_access_token_enc, chatwoot_account_id, chatwoot_inbox_id, chatwoot_api_token_enc')
    .eq('clinic_id', patient.clinicId || 'CLN-TEST-01')
    .single();

  if (error || !configData) {
    throw new Error('Falha ao obter credenciais do WhatsApp na tabela clinic_config');
  }

  const payload = {
    wa_phone_number_id: configData.wa_phone_number_id,
    wa_access_token: configData.wa_access_token_enc, // campo que vimos na tabela
    patient_name: patient.name,
    exam_type: patient.examType,
    appointment_date: patient.appointmentTime ? `Hoje, às ${patient.appointmentTime}` : (patient.originalDate || "Data Indefinida"),
    template_type: template,
    supabase_schema: schema,
    clinic_id: patient.clinicId || 'CLN-TEST-01',
    phone: patient.phone,
    chatwoot_account_id: configData.chatwoot_account_id,
    chatwoot_inbox_id: configData.chatwoot_inbox_id,
    chatwoot_api_token: configData.chatwoot_api_token_enc
  };

  const response = await fetch('https://n8n.zerofalta.com/webhook/envio-lembrete-via-dashboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([payload])
  });

  if (!response.ok) {
    throw new Error('Falha HTTP ao disparar webhook de lembrete');
  }

  return true;
}
