import { useState, useEffect } from 'react';
import { 
  Calendar, Search, 
  MessageSquare, Clock, Loader2, MoreHorizontal
} from 'lucide-react';
import { fetchDailyAppointments, toggleBotPausa, cancelAppointmentWebhook, sendReminderWebhook } from '../services/api';
import { PatientDetailDrawer } from '../components/dashboard/PatientDetailDrawer';
import type { Patient } from '../components/dashboard/PatientDetailDrawer';
import { getStatusStyles, getInitials } from '../utils/statusUtils';
import clsx from 'clsx';

const SCHEMA = 'schema_cln_001';

export function Agenda() {
  const [appointments, setAppointments] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadAgenda = async () => {
    try {
      setLoading(true);
      const data = await fetchDailyAppointments(SCHEMA);
      
      const mapped = data.map((p: any) => ({
        id: p.id || p.phone,
        name: p.patient_name || p.name || 'Paciente sem nome',
        appointmentTime: p.appointment_datetime ? new Date(p.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        examType: p.exam_type?.toUpperCase() || 'EXAME',
        status: p.status,
        phone: p.phone,
        botPaused: !!p.bot_paused,
        reason: p.human_required_reason,
        lastMsg: p.last_msg
      }));

      setAppointments(mapped);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDrawerOpen(true);
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.examType.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && appointments.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-outline-variant/15 pb-2">
        <div>
          <h2 className="text-3xl font-display font-semibold text-on-surface tracking-tight mb-2 text-balance">
            Agenda do Dia
          </h2>
          <p className="text-on-surface-variant font-medium text-lg">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar paciente ou exame..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl w-full sm:w-[300px] focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-surface-container-low/50 rounded-2xl w-max border border-outline-variant/5">
        {['All', 'Confirmed', 'Scheduled', 'Cancelled', 'Human_Required'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
              filter === f 
                ? "bg-white text-primary shadow-sm scale-105" 
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
            )}
          >
            {f === 'All' && 'Todos'}
            {f === 'Confirmed' && 'Confirmados'}
            {f === 'Scheduled' && 'Agendados'}
            {f === 'Cancelled' && 'Cancelados'}
            {f === 'Human_Required' && 'Intervenção'}
          </button>
        ))}
      </div>

      {/* Table Style List */}
      <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 text-on-surface-variant">
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest border-b border-outline-variant/5">Horário</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest border-b border-outline-variant/5">Paciente</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest border-b border-outline-variant/5">Exame</th>
                <th className="px-8 py-5 text-left text-xs font-bold uppercase tracking-widest border-b border-outline-variant/5">Status</th>
                <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-widest border-b border-outline-variant/5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((patient) => (
                  <tr 
                    key={patient.id}
                    onClick={() => handlePatientClick(patient)}
                    className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-on-surface-variant opacity-40" />
                        <span className="font-bold text-on-surface">{patient.appointmentTime}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center font-display font-bold text-primary text-sm">
                          {getInitials(patient.name)}
                        </div>
                        <span className="font-semibold text-on-surface text-lg tracking-tight group-hover:text-primary transition-colors">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-lg">
                        {patient.examType}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={clsx(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border",
                        getStatusStyles(patient.status)
                      )}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); /* WA Action */ }}
                          className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-all">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-on-surface-variant opacity-60">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar size={40} strokeWidth={1.5} />
                      <p className="font-medium text-lg">Nenhum agendamento encontrado para estes filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PatientDetailDrawer 
        patient={selectedPatient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onToggleBotPausa={async (id, paused) => {
          await toggleBotPausa(SCHEMA, id, paused);
          setAppointments(prev => prev.map(p => p.id === id ? { ...p, botPaused: paused } : p));
          if (selectedPatient?.id === id) setSelectedPatient({ ...selectedPatient, botPaused: paused });
        }}
        onCancelAppointment={async (p) => {
          if (confirm(`Deseja realmente solicitar o cancelamento para ${p.name}?`)) {
            await cancelAppointmentWebhook({ patient_id: p.id, patient_name: p.name });
            setAppointments(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Cancelled' } : item));
            setIsDrawerOpen(false);
          }
        }}
        onSendReminder={async (p, template) => {
          await sendReminderWebhook(SCHEMA, p, template);
          alert(`Lembrete ${template} enviado!`);
        }}
      />
    </div>
  );
}
