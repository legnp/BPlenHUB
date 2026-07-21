"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Camera,
  Globe,
  Instagram,
  Linkedin,
  Save,
  X,
  Loader2,
  Briefcase
} from "lucide-react";
import {
  getPartnersAction,
  upsertPartnerAction,
  deletePartnerAction,
  PartnerData
} from "@/actions/admin/partners";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * BPlen HUB — Admin: Gestao de Parceiros
 */
export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partial<PartnerData> | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Ramos Sugeridos Iniciais
  const initialRamos = ["Finanças", "Recrutamento e Seleção", "Contabilidade", "Coach", "Jurídico", "Marketing", "Tecnologia"];

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    setIsLoading(true);
    const data = await getPartnersAction();
    setPartners(data);
    setIsLoading(false);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editingPartner?.name || !editingPartner?.serviceType) {
      setMessage({ type: 'error', text: "Nome e Ramo são obrigatórios." });
      return;
    }

    setIsSaving(true);
    const res = await upsertPartnerAction(editingPartner as PartnerData, base64Image || undefined);
    
    if (res.success) {
      setMessage({ type: 'success', text: "Parceiro salvo com sucesso!" });
      setShowModal(false);
      setEditingPartner(null);
      setBase64Image(null);
      loadPartners();
    } else {
      setMessage({ type: 'error', text: res.error || "Erro ao salvar." });
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este parceiro?")) return;
    const res = await deletePartnerAction(id);
    if (res.success) loadPartners();
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      
      <FunctionalPageHeader
        eyebrow="Ecossistema Estratégico BPlen"
        title="Gestão de Parceiros"
        icon={<Briefcase size={24} />}
        action={
          <button
            onClick={() => {
              setEditingPartner({ isActive: true, socials: {}, keywords: [] });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={14} />
            Novo Parceiro
          </button>
        }
      />

      {/* Lista de parceiros */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
           <Loader2 className="animate-spin text-white/20" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {partners.map(partner => (
             <div key={partner.id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] glass hover:border-white/20 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-[var(--input-bg)] overflow-hidden flex-shrink-0 border border-[var(--border-primary)]">
                      {partner.photoUrl ? (
                         <img src={partner.photoUrl} alt={partner.name} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                            <Camera size={20} />
                         </div>
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[var(--text-primary)] truncate">{partner.name}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] bg-[var(--accent-start)]/10 px-2 py-0.5 rounded-md">
                         {partner.serviceType}
                      </span>
                   </div>
                </div>
                
                <p className="mt-4 text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed italic">
                   {partner.description}
                </p>

                <div className="mt-6 pt-6 border-t border-[var(--border-primary)] flex justify-between items-center">
                   <div className="flex gap-2">
                      {partner.socials?.instagram && <Instagram size={14} className="text-[var(--text-muted)]" />}
                      {partner.socials?.linkedin && <Linkedin size={14} className="text-[var(--text-muted)]" />}
                      {partner.socials?.site && <Globe size={14} className="text-[var(--text-muted)]" />}
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingPartner(partner);
                          setShowModal(true);
                        }}
                        className="p-3 bg-[var(--input-bg)] hover:bg-[var(--accent-soft)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-start)] transition-all"
                      >
                         <Save size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(partner.id!)}
                        className="p-3 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-500/40 hover:text-red-500 transition-all"
                      >
                         <Trash2 size={14} />
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Modal de cadastro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3rem] p-10 space-y-8 relative overflow-y-auto max-h-[90vh] shadow-2xl">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                 <X size={24} />
              </button>

              <div className="space-y-1">
                 <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter">
                    {editingPartner?.id ? "Editar Parceiro" : "Novo Parceiro"}
                 </h2>
                 <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Preencha os dados do parceiro</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Foto Upload */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Logo ou Foto Principal</label>
                    <label className="flex flex-col items-center justify-center w-full aspect-square bg-[var(--input-bg)] border-2 border-dashed border-[var(--border-primary)] rounded-3xl cursor-pointer hover:bg-[var(--accent-soft)] transition-all overflow-hidden relative group">
                       {(base64Image || editingPartner?.photoUrl) ? (
                         <img src={base64Image || editingPartner?.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="Preview" />
                       ) : (
                         <div className="flex flex-col items-center text-[var(--text-muted)]">
                            <Plus size={32} />
                            <span className="text-[9px] font-black uppercase mt-2">Upload WebP</span>
                         </div>
                       )}
                       <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <Camera size={24} className="text-white" />
                       </div>
                    </label>
                 </div>

                 {/* Dados Básicos */}
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome</label>
                       <input 
                         type="text"
                         value={editingPartner?.name || ""}
                         onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                         className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-all"
                         placeholder="Ex: Consultoria BPlen"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Ramo de Atuação</label>
                       <select 
                         value={editingPartner?.serviceType || ""}
                         onChange={(e) => setEditingPartner({ ...editingPartner, serviceType: e.target.value })}
                         className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-all"
                       >
                          <option value="" className="bg-[var(--bg-primary)]">Selecione um Ramo</option>
                          {initialRamos.map(r => <option key={r} value={r} className="bg-[var(--bg-primary)]">{r}</option>)}
                          <option value="Outro" className="bg-[var(--bg-primary)]">Outro (Especifique abaixo)</option>
                       </select>
                    </div>
                    {editingPartner?.serviceType === "Outro" && (
                       <input 
                        type="text"
                        placeholder="Novo Ramo..."
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-all mt-2"
                        onBlur={(e) => setEditingPartner({ ...editingPartner, serviceType: e.target.value })}
                       />
                    )}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Descrição de Serviços (Max 200 chars)</label>
                 <textarea 
                   rows={3}
                   value={editingPartner?.description || ""}
                   onChange={(e) => setEditingPartner({ ...editingPartner, description: e.target.value })}
                   className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent-start)] outline-none transition-all resize-none"
                   placeholder="Descreva o que o parceiro oferece para o ecossistema..."
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Instagram size={10} /> Instagram</label>
                     <input 
                       type="text"
                       className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[10px] text-[var(--text-primary)] outline-none"
                       value={editingPartner?.socials?.instagram || ""}
                       onChange={(e) => setEditingPartner({ ...editingPartner, socials: { ...editingPartner?.socials, instagram: e.target.value } })}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Linkedin size={10} /> LinkedIn</label>
                     <input 
                       type="text"
                       className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[10px] text-[var(--text-primary)] outline-none"
                       value={editingPartner?.socials?.linkedin || ""}
                       onChange={(e) => setEditingPartner({ ...editingPartner, socials: { ...editingPartner?.socials, linkedin: e.target.value } })}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Globe size={10} /> Site Oficial</label>
                     <input 
                       type="text"
                       className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[10px] text-[var(--text-primary)] outline-none"
                       value={editingPartner?.socials?.site || ""}
                       onChange={(e) => setEditingPartner({ ...editingPartner, socials: { ...editingPartner?.socials, site: e.target.value } })}
                     />
                  </div>
               </div>

              <div className="pt-8 border-t border-white/5 flex gap-4">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editingPartner?.id ? "Atualizar Parceiro" : "Criar Parceiro"}
                 </button>
                 <button 
                   onClick={() => setShowModal(false)}
                   className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                 >
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
