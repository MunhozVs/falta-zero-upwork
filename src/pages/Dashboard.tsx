import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PatientDetailDrawer } from '../components/dashboard/PatientDetailDrawer';
import type { Patient } from '../components/dashboard/PatientDetailDrawer';
import { fetchDailyAppointments, fetchWaitlist, fetchHumanInterventions, fetchClinicConfig } from '../services/api';
import clsx from 'clsx';

const SCHEMA = 'schema_cln_001'; // Mocking the schema selection for now

const secretaryKPIs = [
  { label: 'Agendamentos Hoje', value: '...', icon: CalendarIcon, color: 'text-primary' },
  { label: 'Confirmados', value: '...', icon: CheckCircle, color: 'text-green-600' },
  { label: 'Alertas (Intervenção)', value: '...', icon: ShieldAlert, color: 'text-tertiary-container' },
  { label: 'Vagas Recuperadas', value: '0', icon: Users, color: 'text-primary' },
];

const statusColors: Record<string, string> = {
  'Scheduled': "bg-blue-50 text-blue-700 border border-blue-200",
  'Confirmed': "bg-green-50 text-green-700 border border-green-200",
  'Cancelled': "bg-red-50 text-red-700 border border-red-200",
  'Completed': "bg-gray-100 text-gray-700 border border-gray-200",
  'Human_Required': "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20",
};

const getStatusStyles = (status: string) => {
  return statusColors[status] || "bg-surface-container-low text-on-surface-variant border border-outline-variant/10";
};

const getInitials = (name: string) => {
  const names = name.trim().split(' ');
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

export function Dashboard() {
  const { role } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState<Patient[]>([]);
  const [waitlist, setWaitlist] = useState<Patient[]>([]);
  const [pendentes, setPendentes] = useState<Patient[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [apptsData, waitData, humanData, configData] = await Promise.all([
        fetchDailyAppointments(SCHEMA),
        fetchWaitlist(SCHEMA),
        fetchHumanInterventions(SCHEMA),
        fetchClinicConfig(SCHEMA).catch(() => ({ chatwoot_account_id: '0' }))
      ]);

      const chatwootId = configData.chatwoot_account_id;

      const mapPatient = (p: any): Patient => {
        let formattedOrigDate = undefined;
        if (p.original_appointment_date) {
          const dateObj = new Date(p.original_appointment_date);
          formattedOrigDate = new Date(dateObj.getTime() + Math.abs(dateObj.getTimezoneOffset() * 60000)).toLocaleDateString();
        }

        return {
          id: p.id || p.phone || Math.random().toString(),
          name: p.patient_name || p.name || 'Paciente sem nome',
          appointmentTime: p.appointment_datetime ? new Date(p.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          originalDate: formattedOrigDate,
          examType: p.exam_type?.toUpperCase() || 'EXAME',
          status: p.status,
          priority: p.priority,
          lastMsg: p.human_required_reason || p.last_msg || (p.human_required_flag ? "Atenção Necessária" : undefined),
          reason: p.human_required_reason,
          botPaused: !!p.bot_paused,
          gcalEventId: p.gcal_event_id,
          clinicId: p.clinic_id,
          phone: p.phone,
          chatwootAccountId: chatwootId
        };
      };

      setAppointments(apptsData.map(mapPatient));
      setWaitlist(waitData.map(mapPatient));
      setPendentes(humanData.map(mapPatient));

      // Se houver um paciente selecionado, atualiza ele também para refletir mudanças do banco
      if (selectedPatient) {
        const updated = [...apptsData, ...waitData, ...humanData]
          .find(p => (p.id || p.phone) === selectedPatient.id);
        if (updated) {
          setSelectedPatient(mapPatient(updated));
        }
      }

    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Não foi possível carregar os dados. Verifique a conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'secretary') {
      loadData();
    }
  }, [role]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDrawerOpen(true);
  };

  const handleToggleBotPausa = async (patientId: string, paused: boolean) => {
    try {
      import('../services/api').then(async ({ toggleBotPausa }) => {
         await toggleBotPausa(SCHEMA, patientId, paused);
      });
      
      const updateList = (list: Patient[]) => 
        list.map(p => p.id === patientId ? { ...p, botPaused: paused } : p);
        
      setAppointments(updateList);
      setWaitlist(updateList);
      setPendentes(updateList);
      
      if (selectedPatient?.id === patientId) {
        setSelectedPatient({ ...selectedPatient, botPaused: paused });
      }
    } catch (err) {
      console.error('Erro ao pausar bot', err);
    }
  };

  const handleCancelAppointment = async (patient: Patient) => {
    const confirmCancel = window.confirm(`Deseja realmente cancelar o agendamento de ${patient.name}?`);
    if (!confirmCancel) return;

    try {
      const { cancelAppointmentWebhook } = await import('../services/api');
      
      const payload = {
         gcal_event_id: patient.gcalEventId || "",
         patient_name: patient.name,
         supabase_schema: SCHEMA,
         clinic_id: patient.clinicId || "",
         exam_type: patient.examType
      };

      await cancelAppointmentWebhook(payload);
      
      const updateList = (list: Patient[]) => 
        list.map(p => p.id === patient.id ? { ...p, status: 'Cancelled' } : p);
        
      setAppointments(updateList);
      setWaitlist(updateList);
      setPendentes(updateList);
      setIsDrawerOpen(false); 
      console.log('Agendamento cancelado via N8N com sucesso');
    } catch (err) {
      console.error('Erro ao cancelar agendamento', err);
      alert("Falha ao solicitar o cancelamento via webhook.");
    }
  };

  const handleSendReminder = async (patient: Patient, template: string) => {
    try {
      const { sendReminderWebhook } = await import('../services/api');
      await sendReminderWebhook(SCHEMA, patient, template);
      alert(`Lembrete ${template} enviado com sucesso para ${patient.name}!`);
    } catch (err) {
      console.error('Erro ao enviar lembrete', err);
      alert("Falha ao enviar o lembrete via webhook. Verifique as configurações da clínica.");
    }
  };


  if (loading && role === 'secretary' && appointments.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-on-surface-variant font-medium animate-pulse">Sincronizando com a Clínica...</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="h-full w-full flex items-center justify-center min-h-[400px]">
           <div className="bg-red-50 p-8 rounded-[1.5rem] text-center border-2 border-dashed border-red-200  max-w-md">
              <ShieldAlert className="mx-auto text-red-500 mb-4" size={40} />
              <h3 className="text-lg font-bold text-red-700 mb-2">Erro na Sincronização</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-all font-sans"
              >
                Tentar Novamente
              </button>
           </div>
        </div>
     )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section with asymmetry */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-outline-variant/15 pb-6">
        <div>
          <h2 className="text-3xl font-display font-semibold text-on-surface tracking-tight mb-2 text-balance">
            {role === 'secretary' && 'Bom dia, Bruna!'}
            {role === 'doctor' && 'Visão Estratégica da Clínica'}
            {role === 'cto' && 'God Mode: Infraestrutura'}
          </h2>
          <p className="text-on-surface-variant font-medium text-lg">
            {role === 'secretary' && `Você tem ${pendentes.length} alertas pendentes no momento.`}
            {role === 'doctor' && 'Sua taxa de no-show está 15% menor este mês.'}
            {role === 'cto' && 'Todos os sistemas operando normalmente.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl font-medium border border-outline-variant/20 hover:bg-surface-container-low transition-colors duration-200">
            Exportar Relatório
          </button>
          <button className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-br from-primary to-primary-container shadow-ambient hover:opacity-90 transition-all duration-200">
            Nova Ação
          </button>
        </div>
      </div>

      {/* KPI Banners - The Layering Principle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secretaryKPIs.map((kpi, index) => {
          let value = kpi.value;
          if (index === 0) value = appointments.length.toString();
          if (index === 1) value = appointments.filter(a => a.status === 'Confirmed').length.toString();
          if (index === 2) value = pendentes.length.toString();
          
          return (
            <div key={index} className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex flex-col gap-4 relative overflow-hidden group hover:shadow-ambient transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant font-medium">{kpi.label}</span>
                <div className={clsx("p-2 rounded-xl bg-primary/5", kpi.color)}>
                  <kpi.icon size={22} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="text-4xl font-display font-bold text-on-surface tracking-tight">
                {value}
              </h3>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area - Symmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Próximos Agendamentos */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 lg:p-8 min-h-[500px] hover:shadow-sm transition-shadow">
            <h3 className="font-display font-semibold text-xl mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon size={20} className="text-primary" />
                {role === 'secretary' && 'Próximos Agendamentos'}
                {role === 'doctor' && 'Análise de Volume'}
                {role === 'cto' && 'Status de Webhooks'}
              </span>
              <span className="text-sm font-sans font-medium text-primary cursor-pointer hover:underline">Ver tudo</span>
            </h3>
            
            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handlePatientClick(item)}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center font-display font-bold text-primary">
                        {getInitials(item.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">
                          {item.name}
                        </p>
                        <p className="text-sm text-on-surface-variant font-medium">{item.examType} • {item.appointmentTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm",
                        getStatusStyles(item.status)
                      )}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-2 opacity-60 py-20">
                  <CalendarIcon size={40} strokeWidth={1} />
                  <p className="font-medium">Nenhum agendamento para hoje.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Lista de Espera */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 lg:p-8 min-h-[500px] hover:shadow-sm transition-shadow">
            <h3 className="font-display font-semibold text-xl mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users size={20} className="text-primary" />
                {role === 'secretary' && 'Lista de Espera'}
                {role === 'doctor' && 'Protocolos Populares'}
                {role === 'cto' && 'Tenants Recentemente Ativos'}
              </span>
              <span className="text-sm font-sans font-medium text-primary cursor-pointer hover:underline">Gerenciar</span>
            </h3>
            
            <div className="space-y-4">
              {waitlist.length > 0 ? (
                waitlist.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handlePatientClick(item)}
                    className="flex flex-col p-5 rounded-2xl bg-surface-container-low/50 border border-transparent hover:border-primary/10 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center font-display font-bold text-on-surface-variant text-sm border border-outline-variant/10">
                          {getInitials(item.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-on-surface-variant font-medium">Prioridade: {item.priority || 'Normal'}</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm">
                        Oferecer Vaga
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/10">
                        {item.examType}
                      </span>
                      {item.originalDate && (
                        <span className="text-[10px] font-medium text-on-surface-variant italic">
                          Original: {item.originalDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-2 opacity-60 py-20">
                  <Users size={40} strokeWidth={1} />
                  <p className="font-medium">A Lista de espera está vazia.</p>
                </div>
              )}
            </div>

            {role === 'secretary' && (
              <button className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant font-medium hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2">
                <span>➕ Adicionar Paciente Manualmente</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Casos Pendentes (HUMAN_REQUIRED) - Full Width Section */}
      {role === 'secretary' && pendentes.length > 0 && (
        <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 lg:p-8 hover:shadow-sm transition-shadow">
          <h3 className="font-display font-semibold text-xl mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-tertiary-container" />
              Casos Pendentes (Human Required)
            </span>
            <span className="text-sm font-sans font-medium text-on-surface-variant">
              {pendentes.length} intervenções necessárias
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                  <th className="px-4 py-2 font-medium">Horário</th>
                  <th className="px-4 py-2 font-medium">Paciente</th>
                  <th className="px-4 py-2 font-medium">Situação</th>
                  <th className="px-4 py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handlePatientClick(item)}
                    className={clsx(
                      "group transition-all hover:scale-[1.005] cursor-pointer",
                      idx % 2 === 0 ? "bg-surface-container-low/40" : "bg-surface-container-lowest"
                    )}
                  >
                    <td className="px-4 py-4 rounded-l-xl text-sm font-semibold text-primary">
                      {item.appointmentTime}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                          {getInitials(item.name)}
                        </div>
                        <span className="text-sm font-semibold text-on-surface">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-tertiary-container/10 text-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                        {item.lastMsg}
                      </span>
                    </td>
                    <td className="px-4 py-4 rounded-r-xl text-right">
                      <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg shadow-ambient hover:opacity-90 transition-all">
                        Assumir Conversa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Detail Drawer */}
      <PatientDetailDrawer 
        patient={selectedPatient} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onToggleBotPausa={handleToggleBotPausa}
        onCancelAppointment={handleCancelAppointment}
        onSendReminder={handleSendReminder}
      />
    </div>
  );
}
