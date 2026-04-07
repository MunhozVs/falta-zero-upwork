import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Plus, Edit2, RefreshCw, CheckCircle, 
  UploadCloud, X, Loader2, Link as LinkIcon, ArrowLeft
} from 'lucide-react';
import { fetchProtocols, saveProtocol, syncProtocolToDify, uploadProtocolPDF } from '../services/api';
import type { Protocol } from '../services/api';
import clsx from 'clsx';

const SCHEMA = 'schema_cln_001';
const CLINIC_ID = 'CLN-TEST-01'; // Mocking, idealeria vir do config do usuario

export function Protocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Partial<Protocol>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // File upload state
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchProtocols(SCHEMA);
      setProtocols(data);
    } catch (err) {
      console.error('Erro ao carregar protocolos', err);
      setError('Falha ao carregar a lista de protocolos clínicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDrawer = (protocol?: Protocol) => {
    if (protocol) {
      setEditingProtocol({ ...protocol });
    } else {
      setEditingProtocol({
        clinic_id: CLINIC_ID,
        exam_code: '',
        nome_para_paciente: '',
        instrucoes_preparo: '',
        jejum_horas: 0,
        hidratacao: '',
        medicacao_notas: '',
        active: true
      });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProtocol({});
  };

  const handleSave = async () => {
    if (!editingProtocol.exam_code || !editingProtocol.nome_para_paciente) {
      alert("Código do Exame e Nome para o Paciente são obrigatórios.");
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveProtocol(SCHEMA, editingProtocol as Protocol);
      
      // Update local state sem full reload pra ficar estalando de rapido
      setProtocols(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = saved;
          return newArr;
        }
        return [...prev, saved];
      });

      handleCloseDrawer();
    } catch (err) {
      console.error('Erro ao salvar', err);
      alert('Erro ao salvar o protocolo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncDify = async (protocol: Protocol) => {
    try {
      setSyncingId(protocol.id!);
      await syncProtocolToDify(SCHEMA, protocol);
      
      // Atualiza arvore local
      setProtocols(prev => 
        prev.map(p => p.id === protocol.id ? { ...p, dify_synced: true, dify_synced_at: new Date().toISOString() } : p)
      );
      
    } catch (err) {
      console.error('Erro ao sincronizar', err);
      alert('Falha ao acionar o webhook de sincronização do Dify.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadProtocolPDF(SCHEMA, file);
      setEditingProtocol(prev => ({ ...prev, pdf_url: url }));
    } catch (err) {
      console.error('Erro ao subir PDF', err);
      alert('Falha ao enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading && protocols.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-on-surface-variant font-medium animate-pulse">Carregando protocolos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-outline-variant/15 pb-6">
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </Link>
          <h2 className="text-3xl font-display font-semibold text-on-surface tracking-tight mb-2 text-balance">
            Gerenciador de Protocolos
          </h2>
          <p className="text-on-surface-variant font-medium text-lg">
            Crie, versione e sincronize as regras clínicas com a sua Inteligência Artificial.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleOpenDrawer()}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-br from-primary to-primary-container shadow-ambient hover:opacity-90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Protocolo
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols.map(protocol => (
            <div key={protocol.id} className="bg-surface-container-lowest border border-outline-variant/15 rounded-[1.5rem] p-6 hover:shadow-ambient transition-all group flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
               
               <div className="flex justify-between items-start mb-4 z-10">
                 <div className="p-3 bg-surface-container-low text-primary rounded-xl">
                   <FileText size={24} />
                 </div>
                 <div className="flex flex-col items-end">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface px-2 py-1 rounded-full">
                     Versão {protocol.version || 1}
                   </span>
                 </div>
               </div>

               <h3 className="font-display font-bold text-xl text-on-surface mb-1 z-10">
                 {protocol.nome_para_paciente}
               </h3>
               <p className="text-sm text-on-surface-variant mb-6 font-mono bg-surface-container-low px-2 py-1 rounded w-max z-10">
                 {protocol.exam_code}
               </p>

               <div className="mt-auto space-y-4 z-10">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-on-surface-variant font-medium">Status Dify</span>
                   {protocol.dify_synced ? (
                     <span className="flex items-center gap-1 text-green-600 font-bold">
                       <CheckCircle size={14} /> Sincronizado
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 text-tertiary-container font-bold">
                       <RefreshCw size={14} /> Pendente
                     </span>
                   )}
                 </div>

                 <div className="flex items-center gap-2 pt-4 border-t border-outline-variant/10">
                   <button 
                     onClick={() => handleOpenDrawer(protocol)}
                     className="flex-1 px-4 py-2 bg-surface-container-low text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                   >
                     <Edit2 size={16} /> Editar
                   </button>
                   <button 
                     onClick={() => handleSyncDify(protocol)}
                     disabled={syncingId === protocol.id}
                     className={clsx(
                       "flex-1 px-4 py-2 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2",
                       protocol.dify_synced 
                        ? "bg-surface text-on-surface-variant border border-outline-variant/20 hover:border-primary/50" 
                        : "bg-primary text-white shadow-sm hover:opacity-90"
                     )}
                   >
                     {syncingId === protocol.id ? (
                       <Loader2 size={16} className="animate-spin" />
                     ) : (
                       <><RefreshCw size={16} /> Sync</>
                     )}
                   </button>
                 </div>
               </div>
            </div>
          ))}

          {protocols.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
               <FileText size={48} strokeWidth={1} className="mb-4" />
               <p className="font-medium text-lg">Nenhum protocolo cadastrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Centered Modal (Lightbox) for Edit/Create */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 bg-scrim/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={handleCloseDrawer}></div>
          <div className="relative w-full max-w-[550px] bg-surface-container-lowest max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] flex flex-col overflow-hidden animate-in zoom-in-90 fade-in duration-500 border border-white/10">
            <div className="flex items-center justify-between p-8 pb-4">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-2xl text-on-surface">
                  {editingProtocol.id ? 'Refinar Protocolo' : 'Novo Protocolo'}
                </h3>
                <p className="text-sm text-on-surface-variant">Preencha as diretrizes para a IA</p>
              </div>
              <button onClick={handleCloseDrawer} className="p-3 rounded-2xl hover:bg-surface-container-low transition-colors bg-surface/50">
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-7 custom-scrollbar">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Identificação do Exame (Código)</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={editingProtocol.exam_code || ''}
                    onChange={e => setEditingProtocol(prev => ({...prev, exam_code: e.target.value}))}
                    placeholder="Ex: EX-RESSO-01"
                    className="flex-1 px-5 py-4 bg-surface-container-low border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary text-on-surface font-medium transition-all"
                  />
                  <div className="px-5 py-4 bg-surface border border-outline-variant/10 rounded-[1.25rem] text-on-surface-variant font-mono text-sm flex items-center justify-center min-w-[80px]">
                    {`v${editingProtocol.version || 1}`}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Nome Amigável para o Paciente</label>
                <input 
                  type="text" 
                  value={editingProtocol.nome_para_paciente || ''}
                  onChange={e => setEditingProtocol(prev => ({...prev, nome_para_paciente: e.target.value}))}
                  placeholder="Ex: Ressonância Magnética do Crânio"
                  className="w-full px-5 py-4 bg-surface-container-low border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary text-on-surface font-medium transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Diretrizes de Preparo (Contexto IA)</label>
                <textarea 
                  value={editingProtocol.instrucoes_preparo || ''}
                  onChange={e => setEditingProtocol(prev => ({...prev, instrucoes_preparo: e.target.value}))}
                  placeholder="Dê detalhes que o bot usará para orientar o paciente..."
                  rows={4}
                  className="w-full px-5 py-4 bg-surface-container-low border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary text-on-surface resize-none font-medium transition-all leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Jejum (Horas)</label>
                  <input 
                    type="number" 
                    value={editingProtocol.jejum_horas || 0}
                    onChange={e => setEditingProtocol(prev => ({...prev, jejum_horas: parseInt(e.target.value) || 0}))}
                    className="w-full px-5 py-4 bg-surface-container-low border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary text-on-surface font-medium transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Hidratação</label>
                  <input 
                    type="text" 
                    value={editingProtocol.hidratacao || ''}
                    onChange={e => setEditingProtocol(prev => ({...prev, hidratacao: e.target.value}))}
                    placeholder="Ex: Água liberada"
                    className="w-full px-5 py-4 bg-surface-container-low border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary text-on-surface font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Observações de Medicação</label>
                <input 
                  type="text" 
                  value={editingProtocol.medicacao_notas || ''}
                  onChange={e => setEditingProtocol(prev => ({...prev, medicacao_notas: e.target.value}))}
                  placeholder="Ex: Manter medicações de uso contínuo"
                  className="w-full px-5 py-4 bg-surface-container-low border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary text-on-surface font-medium transition-all"
                />
              </div>

              {/* Upload de Arquivo */}
              <div className="pt-4 border-t border-outline-variant/10">
                <label className="text-sm font-semibold text-on-surface block mb-3">Anexo Oficial do Protocolo (PDF)</label>
                
                {editingProtocol.pdf_url ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} />
                      <span className="font-medium text-sm">PDF Anexado</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={editingProtocol.pdf_url} target="_blank" rel="noreferrer" className="p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors">
                        <LinkIcon size={16} />
                      </a>
                      <button onClick={() => setEditingProtocol(prev => ({...prev, pdf_url: ''}))} className="p-2 bg-emerald-100 rounded-lg text-emerald-800 hover:bg-red-100 hover:text-red-700 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <div className={clsx(
                      "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200",
                      uploading ? "bg-surface-container-low border-primary/50" : "bg-surface-container-lowest border-outline-variant/30 group-hover:border-primary group-hover:bg-primary/5"
                    )}>
                      {uploading ? (
                        <>
                          <Loader2 size={32} className="text-primary animate-spin mb-3" />
                          <span className="font-semibold text-primary">Enviando PDF...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-surface-container-low rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3">
                            <UploadCloud size={24} />
                          </div>
                          <span className="font-semibold text-on-surface">Clique ou arraste o PDF</span>
                          <span className="text-xs text-on-surface-variant mt-1">Tam. máximo: 5MB</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="p-8 border-t border-outline-variant/10 bg-surface/30 backdrop-blur-md flex justify-end gap-4 z-10">
              <button 
                onClick={handleCloseDrawer}
                className="px-8 py-4 font-bold text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || uploading}
                className="px-8 py-4 font-bold text-white bg-gradient-to-br from-primary to-primary-container rounded-2xl shadow-ambient hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Salvar Protocolo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
