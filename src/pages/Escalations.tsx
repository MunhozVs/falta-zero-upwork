import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Clock, BarChart3, Users, 
  ChevronRight, AlertCircle, 
  CheckCircle2, User, ArrowUpRight, Loader2
} from 'lucide-react';
import { fetchEscalationData } from '../services/api';
import type { EscalationMetrics } from '../services/api';

const SCHEMA = 'schema_cln_001';

export function Escalations() {
  const [data, setData] = useState<{ activeQueue: any[], metrics: EscalationMetrics | null }>({
    activeQueue: [],
    metrics: null
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchEscalationData(SCHEMA);
      setData(res);
    } catch (err) {
      console.error('Erro ao carregar escalações', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data.metrics) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const { activeQueue, metrics } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-outline-variant/15 pb-2">
        <div>
          <h2 className="text-3xl font-display font-semibold text-on-surface tracking-tight mb-2 text-balance">
            Fila de Intervenção Humana
          </h2>
          <p className="text-on-surface-variant font-medium text-lg">
            Monitore gargalos na automação e atenda casos críticos em tempo real.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 shadow-sm hover:shadow-ambient transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-medium">Fila Ativa</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <ShieldAlert size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-display font-bold text-on-surface">{metrics?.totalActive || 0}</h3>
          <p className="text-sm text-on-surface-variant mt-2">Casos aguardando agora</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 shadow-sm hover:shadow-ambient transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-medium">Taxa de Escalação</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-display font-bold text-on-surface">{metrics?.escalationRate || 0}%</h3>
          <p className="text-sm text-on-surface-variant mt-2">Dos agendamentos de hoje</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 shadow-sm hover:shadow-ambient transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-medium">Tempo de Espera</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-display font-bold text-on-surface">{metrics?.avgWaitMinutes || 0}m</h3>
          <p className="text-sm text-on-surface-variant mt-2">Média para o primeiro toque</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] border border-outline-variant/10 shadow-sm hover:shadow-ambient transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-medium">Resolvidos Hoje</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-display font-bold text-on-surface">{metrics?.totalResolvedToday || 0}</h3>
          <p className="text-sm text-on-surface-variant mt-2">Casos concluídos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-display font-bold text-xl text-on-surface flex items-center gap-2 mb-4">
            <Users size={22} className="text-primary" />
            Fila Prioritária de Atendimento
          </h4>
          
          <div className="space-y-3">
            {activeQueue.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest border border-outline-variant/10 p-5 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface">{item.patient_name}</h5>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="bg-surface px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">{item.exam_type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-red-500 font-medium text-xs">
                        <AlertCircle size={12} /> {item.human_required_reason || 'Intervenção solicitada'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Aguardando</p>
                    <p className="text-sm font-bold text-on-surface">~12 min</p>
                  </div>
                  <div className="p-2 rounded-xl bg-surface group-hover:bg-primary text-on-surface-variant group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            ))}

            {activeQueue.length === 0 && (
              <div className="bg-emerald-50/30 border border-emerald-100 p-12 rounded-[2rem] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h5 className="text-emerald-900 font-bold text-lg">Tudo em dia!</h5>
                <p className="text-emerald-700/70 max-w-xs mx-auto">Não há pacientes aguardando intervenção humana no momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Metrics (Reasons & Exams) */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm">
             <h4 className="font-display font-bold text-lg text-on-surface flex items-center gap-2 mb-6">
                <BarChart3 size={20} className="text-primary" />
                Motivos de Escalação
             </h4>
             <div className="space-y-5">
                {(metrics?.reasonDistribution || []).map((rd, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-on-surface">{rd.reason}</span>
                      <span className="text-on-surface-variant">{rd.count}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.min(100, (rd.count / Math.max(1, metrics?.totalActive || 0)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {(!metrics?.reasonDistribution || metrics.reasonDistribution.length === 0) && (
                  <p className="text-sm text-on-surface-variant italic text-center py-4">Sem dados de motivos hoje.</p>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
