import { X, MessageSquare, Pause, Bell, Calendar, Clock, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export interface Patient {
  id: string;
  name: string;
  appointmentTime?: string;
  originalDate?: string;
  examType: string;
  status: string;
  reason?: string;
  lastMsg?: string;
  priority?: string;
  phone?: string;
  botPaused?: boolean;
  gcalEventId?: string;
  clinicId?: string;
  chatwootAccountId?: string;
}

interface PatientDetailDrawerProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBotPausa?: (id: string, paused: boolean) => void;
  onCancelAppointment?: (patient: Patient) => void;
  onSendReminder?: (patient: Patient, template: string) => void;
}

import { getStatusStyles, getInitials } from '../../utils/statusUtils';

export function PatientDetailDrawer({ patient, isOpen, onClose, onToggleBotPausa, onCancelAppointment, onSendReminder }: PatientDetailDrawerProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Fecha o menu sempre que a gaveta fechar ou trocar de paciente
  if (!patient) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside 
        className={clsx(
          "fixed top-0 right-0 h-full w-full max-w-[450px] glass shadow-ambient z-[100] transition-transform duration-500 ease-out border-l border-outline-variant/20",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {getInitials(patient.name)}
             </div>
             <div>
                <h2 className="font-display font-semibold text-lg text-on-surface tracking-tight">
                  {patient.name}
                </h2>
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  #{Math.floor(Math.random() * 90000) + 10000} • PACIENTE
                </span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto h-[calc(100%-80px)]">
          
          {/* Status Chips */}
          <div className="flex flex-wrap gap-2">
            <span className={clsx(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm",
              getStatusStyles(patient.status)
            )}>
              {patient.status}
            </span>
            {patient.priority && (
              <span className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-outline-variant/20">
                Prioridade: {patient.priority}
              </span>
            )}
          </div>

          {/* Details Section */}
          <section className="space-y-4">
             <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Informações do Exame</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Data/Hora</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {patient.appointmentTime ? `Hoje • ${patient.appointmentTime}` : (patient.originalDate ? `Agend. Original: ${patient.originalDate}` : 'Data Indefinida')}
                  </p>
                </div>
                <div className="bg-surface-container-low/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Tipo Exame</span>
                  </div>
                  <p className="font-semibold text-sm truncate">{patient.examType}</p>
                </div>
             </div>
          </section>

          {/* Chat / Last Message / Alert Reason */}
          {(patient.lastMsg || patient.reason) && (
            <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                {patient.reason ? <AlertCircle size={14} className="text-tertiary-container" /> : <MessageSquare size={14} />}
                {patient.reason ? 'Motivo da Intervenção' : 'Última Mensagem'}
              </h3>
              <div className={clsx(
                "p-5 rounded-2xl border-l-4 italic text-sm text-on-surface relative",
                patient.reason ? "bg-tertiary-container/5 border-tertiary-container" : "bg-primary/5 border-primary"
              )}>
                "{patient.reason || patient.lastMsg}"
                <div className="absolute top-2 right-2 opacity-20">
                   {patient.reason ? <AlertCircle size={16} /> : <MessageSquare size={16} />}
                </div>
              </div>
            </section>
          )}

          {/* Primary Actions */}
          <section className="space-y-4 pt-4 border-t border-outline-variant/10">
             <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Central de Comando</h3>
             
             <div className="flex flex-col gap-3">
                <button 
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-2xl shadow-ambient hover:opacity-90 transition-all"
                  onClick={() => {
                    const baseUrl = 'https://chat.zerofalta.com/app/accounts';
                    const accountId = patient.chatwootAccountId || '0';
                    const search = patient.phone || patient.name;
                    window.open(`${baseUrl}/${accountId}/contacts?search=${search}`, '_blank');
                  }}
                >
                  <MessageSquare size={18} />
                  Assumir no Chatwoot
                  <ExternalLink size={14} className="opacity-60" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onToggleBotPausa && onToggleBotPausa(patient.id, !patient.botPaused)}
                    className={clsx(
                      "flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all border",
                      patient.botPaused 
                        ? "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/30 hover:bg-tertiary-container/20" 
                        : "bg-surface-container-low text-on-surface border-outline-variant/10 hover:bg-surface-container-high"
                    )}
                  >
                    <Pause size={16} />
                    {patient.botPaused ? "Retomar Bot" : "Pausar Bot"}
                  </button>
                  <div className="relative flex">
                    <button 
                      onClick={() => setShowMenu(!showMenu)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all border border-outline-variant/10"
                    >
                      <Bell size={16} />
                      Lembrete
                    </button>
                    
                    {showMenu && (
                      <div className="absolute bottom-[110%] right-0 w-[200px] bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-ambient p-2 flex flex-col gap-1 z-[200] animate-in fade-in slide-in-from-bottom-2">
                        <button 
                          onClick={() => { setShowMenu(false); onSendReminder && onSendReminder(patient, 'T48'); }}
                          className="text-sm font-medium text-left px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          T48: Lembrete 48h
                        </button>
                        <button 
                          onClick={() => { setShowMenu(false); onSendReminder && onSendReminder(patient, 'T24'); }}
                          className="text-sm font-medium text-left px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          T24: Lembrete 24h
                        </button>
                        <button 
                          onClick={() => { setShowMenu(false); onSendReminder && onSendReminder(patient, 'T12'); }}
                          className="text-sm font-medium text-left px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          T12: Lembrete 12h
                        </button>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-4">
             <button 
                onClick={() => onCancelAppointment && onCancelAppointment(patient)}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all"
             >
                <Trash2 size={16} />
                Cancelar Agendamento
             </button>
          </section>

        </div>
      </aside>
    </>
  );
}
