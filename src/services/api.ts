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

export interface ExamVolume {
  name: string;
  count: number;
  percentage: number;
}

export interface DoctorMetrics {
  totalAppointments: number;
  noShowCount: number;
  confirmedCount: number;
  vagasRecuperadas: number;
  averageTicketValue: number;
  examVolume: ExamVolume[];
}

/**
 * Busca as métricas consolidadas para o Dashboard do Gestor (Médico).
 */
export async function fetchDoctorMetrics(schema: string): Promise<DoctorMetrics> {
  const supabase = getClinicClient(schema);

  // 1. Agendamentos (No-Show, Confirmações e Volume de Exames)
  const { data: appointmentsData, error: apptError } = await supabase
    .from('appointments')
    .select('status, exam_type');

  if (apptError) throw apptError;

  const totalAppointments = appointmentsData?.length || 0;
  const noShowCount = appointmentsData?.filter(a => a.status === 'No_Show' || a.status === 'No-Show').length || 0;
  const confirmedCount = appointmentsData?.filter(a => a.status === 'Confirmed').length || 0;

  // Cálculo de volume por exame
  const examCounts: Record<string, number> = {};
  appointmentsData?.forEach(a => {
    // Padronizar capitalização para evitar duplicatas, ex: "Ressonância" e "ressonância"
    const examName = a.exam_type?.trim() || 'Não Especificado';
    const formatted = examName.charAt(0).toUpperCase() + examName.slice(1).toLowerCase();
    examCounts[formatted] = (examCounts[formatted] || 0) + 1;
  });

  const examVolume: ExamVolume[] = Object.entries(examCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Vagas recuperadas (Lista de Espera que virou Confirmed)
  const { data: waitlistData, error: waitlistError } = await supabase
    .from('waitlist')
    .select('status');

  if (waitlistError) throw waitlistError;

  const vagasRecuperadas = waitlistData?.filter(w => w.status === 'Confirmed').length || 0;

  // 3. Ticket Médio
  const { data: configData, error: configError } = await supabase
    .from('clinic_config')
    .select('average_ticket_value')
    .limit(1)
    .single();

  const averageTicketValue = configData?.average_ticket_value || 0;

  return {
    totalAppointments,
    noShowCount,
    confirmedCount,
    vagasRecuperadas,
    averageTicketValue,
    examVolume
  };
}

/**
 * Atualiza o valor do ticket médio na configuração da clínica.
 */
export async function updateAverageTicket(schema: string, newValue: number) {
  const supabase = getClinicClient(schema);
  
  // Pegamos a chave primária ou id da clínica pra atualizar com segurança
  const { data: configData, error: fetchErr } = await supabase
    .from('clinic_config')
    .select('clinic_id')
    .limit(1)
    .single();

  if (fetchErr || !configData) throw new Error('Falha ao obter dados da clínica para edição');

  const { data, error } = await supabase
    .from('clinic_config')
    .update({ average_ticket_value: newValue })
    .eq('clinic_id', configData.clinic_id);

  if (error) throw error;
  return data;
}

export interface Protocol {
  id?: string;
  clinic_id: string;
  exam_code: string;
  nome_para_paciente: string;
  instrucoes_preparo: string;
  jejum_horas?: number;
  hidratacao?: string;
  medicacao_notas?: string;
  pdf_url?: string;
  pdf_hash?: string;
  dify_synced?: boolean;
  dify_synced_at?: string;
  version?: number;
  active?: boolean;
}

export async function fetchProtocols(schema: string): Promise<Protocol[]> {
  const supabase = getClinicClient(schema);
  const { data, error } = await supabase
    .from('protocols')
    .select('*')
    .eq('active', true)
    .order('exam_code', { ascending: true });

  if (error) throw error;
  return data;
}

export async function saveProtocol(schema: string, protocol: Protocol) {
  const supabase = getClinicClient(schema);

  if (protocol.id) {
    // Update existing protocol
    const { data: extg, error: errFetch } = await supabase
      .from('protocols')
      .select('version')
      .eq('id', protocol.id)
      .single();

    const currentVersion = extg ? extg.version : 0;
    
    const { data, error } = await supabase
      .from('protocols')
      .update({
        ...protocol,
        version: currentVersion + 1,
        dify_synced: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new protocol
    const { data, error } = await supabase
      .from('protocols')
      .insert([
        { ...protocol, version: 1, dify_synced: false }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function syncProtocolToDify(schema: string, protocol: Protocol) {
  const response = await fetch('https://n8n.zerofalta.com/webhook/sync-protocol', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schema,
      protocol: {
        ...protocol
      }
    })
  });

  if (!response.ok) {
    throw new Error('Falha HTTP ao disparar webhook de sincronização com Dify');
  }

  // Update synced flag localmente
  const supabase = getClinicClient(schema);
  await supabase
    .from('protocols')
    .update({ dify_synced: true, dify_synced_at: new Date().toISOString() })
    .eq('id', protocol.id);

  return true;
}

export async function uploadProtocolPDF(schema: string, file: File): Promise<string> {
  const supabase = getClinicClient(schema);
  // Example path using schema + timestamp + filename to avoid colisions
  const filePath = `${schema}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('protocols_pdfs')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('protocols_pdfs')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export interface EscalationReasonCount {
  reason: string;
  count: number;
}

export interface EscalationMetrics {
  totalActive: number;
  escalationRate: number; // % do total de agendamentos
  avgWaitMinutes: number;
  reasonDistribution: EscalationReasonCount[];
  totalResolvedToday: number;
}

export async function fetchEscalationData(schema: string): Promise<{
  activeQueue: any[],
  metrics: EscalationMetrics
}> {
  const supabase = getClinicClient(schema);

  // 1. Fila Ativa (quem está com human_required_flag = true agora)
  const { data: activeQueue, error: queueErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('human_required_flag', true)
    .order('human_required_at', { ascending: true });

  if (queueErr) throw queueErr;

  // 2. Métricas Gerais (usando appointments do dia pra taxa)
  const today = new Date().toISOString().split('T')[0];
  const { data: allToday, error: allErr } = await supabase
    .from('appointments')
    .select('human_required_flag, human_required_reason, human_required_at, updated_at')
    .gte('appointment_datetime', today);

  if (allErr) throw allErr;

  const totalToday = allToday?.length || 0;
  const escalatedToday = allToday?.filter(a => a.human_required_flag).length || 0;
  const escalationRate = totalToday > 0 ? Math.round((escalatedToday / totalToday) * 100) : 0;

  // Distribuição de Motivos
  const reasonCounts: Record<string, number> = {};
  allToday?.forEach(a => {
    if (a.human_required_flag && a.human_required_reason) {
      const r = a.human_required_reason || 'Outros';
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    }
  });

  const reasonDistribution = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // Tempo médio (simulado se não houver resolved_at, usando updated_at se flag for false mas foi true)
  // Simplificação: vamos focar no volume e taxa por enquanto
  
  const metrics: EscalationMetrics = {
    totalActive: activeQueue?.length || 0,
    escalationRate,
    avgWaitMinutes: 12, // Mock por enquanto se não houver log de resolução
    reasonDistribution,
    totalResolvedToday: allToday?.filter(a => !a.human_required_flag && a.updated_at > today).length || 0
  };

  return {
    activeQueue: activeQueue || [],
    metrics
  };
}
