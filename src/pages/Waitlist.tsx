import { useState, useEffect } from 'react';
import { 
  Users, Search, MessageSquare, 
  Clock, Calendar, AlertCircle, Loader2, 
  Star, User, Trash2
} from 'lucide-react';
import { fetchWaitlist, toggleBotPausa, cancelAppointmentWebhook, sendReminderWebhook } from '../services/api';
import { PatientDetailDrawer } from '../components/dashboard/PatientDetailDrawer';
import type { Patient } from '../components/dashboard/PatientDetailDrawer';
import { getInitials } from '../utils/statusUtils';
import clsx from 'clsx';

const SCHEMA = 'schema_cln_001';

export function Waitlist() {
  const [waitlist, setWaitlist] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadWaitlist = async () => {
    try {
      setLoading(true);
      const data = await fetchWaitlist(SCHEMA);
      
      const mapped = data.map((p: any) => ({
        id: p.id || p.phone,
        name: p.patient_name || p.name || 'Paciente sem nome',
        originalDate: p.original_appointment_datetime ? new Date(p.original_appointment_datetime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : undefined,
        examType: p.exam_type?.toUpperCase() || 'EXAME',
        status: 'Waitlist',
        phone: p.phone,
        priority: p.priority || 'Normal',
        botPaused: !!p.bot_paused,
        reason: p.reason || 'Aguardando vaga antecipada'
      }));

      setWaitlist(mapped);
    } catch (err) {
      console.error('Erro ao carregar lista de espera:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, []);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDrawerOpen(true);
  };

  const filteredWaitlist = waitlist.filter(a => {
    const matchesFilter = filter === 'All' || a.priority === filter;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.examType.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (priority: any) => {
    const p = String(priority || '').toLowerCase();
    switch (p) {
      case 'urgent': return 'bg-red-50 text-red-600 border-red-100';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  if (loading && waitlist.length === 0) {
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
            Lista de Espera
          </h2>
          <p className="text-on-surface-variant font-medium text-lg">
            Gerencie {waitlist.length} pacientes aguardando antecipação de vaga.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou exame..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl w-full sm:w-[300px] focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs / Priority Filters */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-surface-container-low/50 rounded-2xl w-max border border-outline-variant/5">
        {[
          { id: 'All', label: 'Todos' },
          { id: 'Urgent', label: 'Urgentes', icon: AlertCircle },
          { id: 'High', label: 'Alta Prioridade', icon: Star },
          { id: 'Normal', label: 'Normal' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              filter === f.id 
                ? "bg-white text-primary shadow-sm scale-105" 
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
            )}
          >
            {f.icon && <f.icon size={14} />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid of Waitlist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWaitlist.length > 0 ? (
          filteredWaitlist.map((item) => (
            <div 
              key={item.id}
              onClick={() => handlePatientClick(item)}
              className="bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-[2rem] hover:shadow-ambient hover:scale-[1.02] transition-all cursor-pointer group relative flex flex-col justify-between min-h-[280px]"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center font-display font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all text-lg shadow-sm border border-primary/10">
                      {getInitials(item.name)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-on-surface group-hover:text-primary transition-colors text-xl tracking-tight leading-tight">
                        {item.name}
                      </h3>
                      <div className={clsx(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border w-max mt-2 shadow-sm",
                        getPriorityColor(item.priority || 'Normal')
                      )}>
                        {item.priority || 'Normal'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 py-4 border-y border-outline-variant/5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                      <Calendar size={14} className="opacity-60" />
                      <span>Data Original:</span>
                    </div>
                    <span className="font-bold text-on-surface">{item.originalDate || 'Não informada'}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                      <Clock size={16} className="opacity-60" />
                      <span>Exame:</span>
                    </div>
                    <span className="font-bold text-primary px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                      {item.examType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between relative z-10 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-medium text-on-surface-variant italic opacity-60">
                   <Clock size={12} />
                   <span>Entrou na lista há 2 dias</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* Offer slot action */ }}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-container hover:text-primary transition-all shadow-ambient active:scale-95"
                >
                  Oferecer Vaga
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-outline-variant/10">
            <div className="flex flex-col items-center gap-4">
              <Users size={64} className="text-on-surface-variant opacity-20" />
              <h4 className="text-xl font-bold text-on-surface opacity-40">Ninguém na fila por enquanto</h4>
              <p className="text-on-surface-variant max-w-sm mx-auto px-8">A lista de espera está vazia para os filtros selecionados.</p>
            </div>
          </div>
        )}
      </div>

      <PatientDetailDrawer 
        patient={selectedPatient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onToggleBotPausa={async (id, paused) => {
          await toggleBotPausa(SCHEMA, id, paused);
          setWaitlist(prev => prev.map(p => p.id === id ? { ...p, botPaused: paused } : p));
          if (selectedPatient?.id === id) setSelectedPatient({ ...selectedPatient, botPaused: paused });
        }}
        onCancelAppointment={async (p) => {
          if (confirm(`Remover ${p.name} da lista de espera?`)) {
            // No real scenario we might have a specific endpoint for waitlist removal
            setWaitlist(prev => prev.filter(item => item.id !== p.id));
            setIsDrawerOpen(false);
          }
        }}
        onSendReminder={async (p, template) => {
          await sendReminderWebhook(SCHEMA, p, template);
          alert(`Mensagem "${template}" enviada para ${p.name}!`);
        }}
      />
    </div>
  );
}
