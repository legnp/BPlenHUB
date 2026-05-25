"use client";

import React, { useState } from "react";
import { Product, ProductSheet, CapabilityConfig, WorkflowStep } from "@/types/products";
import { 
  Save, 
  X, 
  Layout, 
  Settings, 
  Zap, 
  Compass, 
  Eye, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Search,
  CheckCircle2,
  FileText,
  Users,
  Handshake,
  ShieldCheck,
  Package
} from "lucide-react";
import { SURVEY_REGISTRY } from "@/config/surveys";
import { saveProductAction } from "@/actions/products";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface AdminProductBuilderProps {
  initialProduct?: Product;
}

/**
 * AdminProductBuilder — BPlen HUB 🧬
 * Componente modular para construção de produtos e workflows dinâmicos.
 */
export function AdminProductBuilder({ initialProduct }: AdminProductBuilderProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'identity' | 'sheet' | 'capabilities' | 'workflow'>('identity');
  const [isSaving, setIsSaving] = useState(false);

  // State unificado do Produto
  const [product, setProduct] = useState<Partial<Product>>(initialProduct || {
    title: "",
    slug: "",
    price: 0,
    targetAudiences: [],
    status: 'draft',
    isStepJourney: false,
    order: 1,
    sheet: {
      description: "",
      coverImage: "",
      paymentConditions: "",
      faq: [],
      termsAndConditions: "",
      seo: { title: "", description: "", keywords: [] },
      deliverables: []
    },
    capabilities: { surveys: [], forms: [], allowedEventTypes: [] },
    workflow: [],
    grantedQuotas: {}
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProductAction(product);
      setIsSaved(true);
      // Pequeno delay para o usuário ver o feedback de sucesso
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch (error) {
      alert("Erro ao salvar produto");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[3rem] overflow-hidden flex flex-col min-h-[700px] shadow-2xl relative text-[var(--text-primary)]">
      
      {/* Builder Header */}
      <div className="p-8 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]/30">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-[var(--accent-primary)]/10 rounded-2xl text-[var(--accent-primary)]">
              <Zap size={20} />
           </div>
           <div>
              <h2 className="text-sm font-black uppercase tracking-widest">
                {product.id ? `Editando: ${product.title}` : "Novo Produto Estratégico"}
              </h2>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">Configuração de Ecossistema & Entrega</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.back()}
             className="px-6 py-2.5 rounded-xl border border-[var(--border-primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--input-bg)] transition-all"
           >
             Descartar
           </button>
           <button 
             onClick={handleSave}
             disabled={isSaving || isSaved}
             className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-[var(--text-primary)] text-[var(--bg-primary)]'}`}
           >
             {isSaving ? (
               <Plus className="animate-spin w-3 h-3" />
             ) : isSaved ? (
               <CheckCircle2 size={14} />
             ) : (
               <Save size={14} />
             )}
             {isSaved ? "Sucesso!" : "Salvar Alterações"}
           </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/10">
        <TabButton active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} label="Identidade" icon={<Settings size={14} />} />
        <TabButton active={activeTab === 'sheet'} onClick={() => setActiveTab('sheet')} label="Ficha Técnica" icon={<FileText size={14} />} />
        <TabButton active={activeTab === 'capabilities'} onClick={() => setActiveTab('capabilities')} label="Funcionalidades" icon={<Zap size={14} />} />
        <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} label="Jornada/Workflow" icon={<Compass size={14} />} />
      </div>

      {/* Form Area */}
      <div className="flex-1 p-10 overflow-y-auto max-h-[600px] custom-scrollbar">
        <AnimatePresence mode="wait">
           {activeTab === 'identity' && (
              <motion.div key="identity" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                 <IdentityForm product={product} setProduct={setProduct} />
              </motion.div>
           )}
           {activeTab === 'sheet' && (
              <motion.div key="sheet" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                 <SheetForm product={product} setProduct={setProduct} />
              </motion.div>
           )}
           {activeTab === 'capabilities' && (
              <motion.div key="capabilities" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                 <CapabilitiesForm product={product} setProduct={setProduct} />
              </motion.div>
           )}
           {activeTab === 'workflow' && (
              <motion.div key="workflow" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                 <WorkflowForm product={product} setProduct={setProduct} />
              </motion.div>
           )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// Helpers Components
function TabButton({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${active ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-muted)] opacity-50 hover:opacity-100'}`}
    >
      {icon}
      {label}
    </button>
  );
}

// Sub-forms
function IdentityForm({ product, setProduct }: any) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                ID do Serviço 
                <span className="text-[7px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full font-black">Imutável</span>
              </label>
              <input 
                type="text" 
                placeholder="Ex: BPL-001"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-black outline-none focus:border-[var(--accent-primary)] transition-all uppercase" 
                value={product.serviceCode}
                onChange={(e) => setProduct({...product, serviceCode: e.target.value.toUpperCase()})}
              />
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Título do Produto</label>
              <input 
                type="text" 
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs outline-none focus:border-[var(--accent-primary)] transition-all font-bold" 
                value={product.title}
                onChange={(e) => setProduct({...product, title: e.target.value})}
              />
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Kicker (Destaque do Card)</label>
              <input 
                type="text" 
                placeholder="Ex: PRONTO PARA VOCÊ"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs outline-none focus:border-[var(--accent-primary)] transition-all font-bold" 
                value={product.kicker || ""}
                onChange={(e) => setProduct({...product, kicker: e.target.value})}
              />
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Slug (URL)</label>
              <input 
                type="text" 
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-mono outline-none focus:border-[var(--accent-primary)] transition-all" 
                value={product.slug}
                onChange={(e) => setProduct({...product, slug: e.target.value})}
              />
           </div>
        </div>

        <div className="space-y-6">
           <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Público-Alvo (Segmentação)</label>
           <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'people', label: 'Pessoas (Individual)', icon: <Users size={14} /> },
                { id: 'companies', label: 'Empresas (Corporativo)', icon: <Layout size={14} /> },
                { id: 'partners', label: 'Parceiros (Agências/Mestres)', icon: <Handshake size={14} /> },
                { id: 'internal', label: 'Uso Interno (Privado)', icon: <ShieldCheck size={14} /> }
              ].map((audience) => {
                const isSelected = product.targetAudiences?.includes(audience.id as any);
                return (
                  <button 
                    key={audience.id}
                    type="button"
                    onClick={() => {
                      const current = product.targetAudiences || [];
                      const next = isSelected 
                        ? current.filter((a: string) => a !== audience.id)
                        : [...current, audience.id];
                      setProduct({ ...product, targetAudiences: next });
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--text-primary)]' : 'border-[var(--border-primary)] opacity-40 hover:opacity-100 text-[var(--text-muted)]'}`}
                  >
                     {audience.icon}
                     <span className="text-[10px] font-black uppercase tracking-widest">{audience.label}</span>
                     {isSelected && <CheckCircle2 size={14} className="ml-auto text-[var(--accent-primary)]" />}
                  </button>
                )
              })}
           </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-6 items-start">
        <div className="space-y-4 p-6 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-2xl flex-1 min-w-[300px]">
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => setProduct({...product, isStepJourney: !product.isStepJourney})}>
              <div className={`w-10 h-6 rounded-full transition-all relative ${product.isStepJourney ? 'bg-[var(--accent-primary)]' : 'bg-gray-700'}`}>
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${product.isStepJourney ? 'left-5' : 'left-1'}`} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Produto da Jornada (Step Journey)</p>
                 <p className="text-[8px] text-[var(--text-muted)] italic">Marque se este produto compõe a trilha estratégica no Dashboard.</p>
              </div>
           </div>
           
           {product.isStepJourney && (
              <div className="pt-4 border-t border-[var(--accent-primary)]/10 space-y-2">
                 <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Ordem na Jornada (1 a 6)</label>
                 <input 
                   type="number" 
                   min="1" 
                   max="6"
                   className="w-20 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-2 text-xs"
                   value={product.order}
                   onChange={(e) => setProduct({...product, order: parseInt(e.target.value)})}
                 />
              </div>
           )}
        </div>

        <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-2xl flex-1 min-w-[300px]">
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => setProduct({...product, status: product.status === 'active' ? 'draft' : 'active'})}>
              <div className={`w-10 h-6 rounded-full transition-all relative ${product.status === 'active' ? 'bg-green-500' : 'bg-yellow-500/50'}`}>
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${product.status === 'active' ? 'left-5' : 'left-1'}`} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Status do Produto: <span className={product.status === 'active' ? 'text-green-500' : 'text-yellow-500'}>{product.status === 'active' ? 'ATIVO' : 'RASCUNHO'}</span></p>
                 <p className="text-[8px] text-[var(--text-muted)] italic">Ative para que o produto apareça nas páginas públicas de serviços.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

import { uploadProductCoverAction } from "@/actions/product-sync";
import { useAuth } from "@/hooks/use-auth";

function SheetForm({ product, setProduct }: any) {
   const [isUploading, setIsUploading] = useState(false);
   const [uploadStatus, setUploadStatus] = useState<string | null>(null);

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!product.serviceCode) {
        alert("Por favor, defina o ID do Serviço na aba Identidade antes de fazer upload.");
        return;
      }

      setIsUploading(true);
      setUploadStatus("Iniciando...");
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("serviceCode", product.serviceCode);
        if (product.id) {
          formData.append("productId", product.id);
        }
        // O folderId pode ser nulo se for a primeira vez, a action lidará com isso ou podemos forçar um save primeiro
        if (product.driveConfig?.folderId) {
          formData.append("folderId", product.driveConfig.folderId);
        }

        const result = await uploadProductCoverAction(formData);
        if (result.success && result.url) {
           setProduct({ ...product, sheet: { ...product.sheet, coverImage: result.url } });
           setUploadStatus("Sucesso!");
        } else {
           throw new Error(result.error);
        }
      } catch (err: any) {
        alert("Erro no upload: " + err.message);
        setUploadStatus("Erro.");
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadStatus(null), 3000);
      }
   };

   return (
     <div className="space-y-8 max-w-3xl">
       <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Descrição de Serviço</label>
          <textarea 
            rows={5}
            placeholder="Descreva o serviço para o cliente..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-6 text-xs leading-relaxed outline-none focus:border-[var(--accent-primary)] transition-all" 
            value={product.sheet.description}
            onChange={(e) => setProduct({...product, sheet: { ...product.sheet, description: e.target.value }})}
          />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preço de Venda (R$)</label>
             <input 
               type="number" 
               className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-black shadow-inner" 
               value={product.price}
               onChange={(e) => setProduct({...product, price: parseFloat(e.target.value)})}
             />
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Capa do Serviço (Local public/services-img/)</label>
             <input 
               type="text" 
               placeholder="Ex: /services-img/meu-servico.webp"
               className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-[10px] font-mono outline-none focus:border-[var(--accent-primary)] transition-all" 
               value={product.sheet?.coverImage || ""}
               onChange={(e) => {
                 let val = e.target.value;
                 if (val.startsWith("public/")) val = val.replace("public/", "/");
                 else if (val.startsWith("/public/")) val = val.replace("/public/", "/");
                 setProduct({...product, sheet: { ...product.sheet, coverImage: val } as ProductSheet});
               }}
             />
             <p className="text-[7px] text-[var(--text-muted)] uppercase tracking-widest italic px-2">
               O arquivo deve ser salvo manualmente na pasta `public/services-img` do projeto.
             </p>
          </div>
       </div>

       {product.driveConfig?.sheetUrl && (
         <div className="p-6 border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                  <FileText size={18} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Planilha de Registro Sincronizada</p>
                  <p className="text-[8px] text-[var(--text-muted)] underline cursor-pointer" onClick={() => window.open(product.driveConfig?.sheetUrl, '_blank')}>Ver no Google Sheets</p>
               </div>
            </div>
            <CheckCircle2 size={16} className="text-green-500" />
         </div>
       )}

       {/* Editor de FAQ (Perguntas Frequentes) 📌 */}
       <div className="pt-8 border-t border-[var(--border-primary)] space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)]">
                   <HelpCircle size={16} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest">Perguntas Frequentes (FAQ)</h4>
             </div>
             <button 
               type="button"
               onClick={() => {
                  const currentFaq = product.sheet.faq || [];
                  setProduct({ 
                     ...product, 
                     sheet: { 
                        ...product.sheet, 
                        faq: [...currentFaq, { question: "Nova Pergunta", answer: "" }] 
                     } 
                  });
               }}
               className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-[var(--accent-primary)] transition-all flex items-center gap-2"
             >
                <Plus size={12} />
                Adicionar FAQ
             </button>
          </div>

          <div className="space-y-4">
             {product.sheet.faq?.map((item: any, idx: number) => (
                <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4 group relative">
                   <button 
                      type="button"
                      onClick={() => {
                         const newFaq = product.sheet.faq.filter((_: any, i: number) => i !== idx);
                         setProduct({ ...product, sheet: { ...product.sheet, faq: newFaq } });
                      }}
                      className="absolute top-4 right-4 p-2 text-red-500/50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                   >
                      <Trash2 size={14} />
                   </button>
                   
                   <div className="space-y-2">
                      <label className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">Pergunta</label>
                      <input 
                        type="text"
                        className="w-full bg-transparent border-b border-white/10 text-[11px] font-black pb-1 focus:border-[var(--accent-primary)] outline-none transition-all"
                        value={item.question}
                        onChange={(e) => {
                           const newFaq = [...product.sheet.faq];
                           newFaq[idx].question = e.target.value;
                           setProduct({ ...product, sheet: { ...product.sheet, faq: newFaq } });
                        }}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">Resposta</label>
                      <textarea 
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] leading-relaxed outline-none focus:border-[var(--accent-primary)] transition-all"
                        value={item.answer}
                        onChange={(e) => {
                           const newFaq = [...product.sheet.faq];
                           newFaq[idx].answer = e.target.value;
                           setProduct({ ...product, sheet: { ...product.sheet, faq: newFaq } });
                        }}
                      />
                   </div>
                </div>
             ))}

             {(!product.sheet.faq || product.sheet.faq.length === 0) && (
                <div className="p-10 border border-dashed border-[var(--border-primary)] rounded-3xl text-center opacity-30">
                   <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma pergunta frequente cadastrada.</p>
                </div>
             )}
          </div>
       </div>

       {/* Termos e Condições Legais ⚖️ */}
       <div className="pt-8 border-t border-[var(--border-primary)] space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)]">
                <ShieldCheck size={16} />
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-widest">Termos, Condições e Regras (Contrato)</h4>
          </div>
          <textarea 
            rows={8}
            placeholder="Insira as regras, termos de uso ou minuta de contrato deste serviço específico..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-6 text-[10px] leading-relaxed outline-none focus:border-[var(--accent-primary)] transition-all font-medium italic opacity-80" 
            value={product.sheet.termsAndConditions}
            onChange={(e) => setProduct({...product, sheet: { ...product.sheet, termsAndConditions: e.target.value }})}
          />
          <p className="text-[7px] text-[var(--text-muted)] uppercase tracking-widest px-2">* Estes termos serão apresentados ao cliente antes da finalização da contratação.</p>
       </div>

       {/* Editor de Entregáveis (Deliverables) 📦 */}
       <div className="pt-8 border-t border-[var(--border-primary)] space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)]">
                   <Package size={16} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest">Entregáveis do Serviço</h4>
             </div>
             <button 
               type="button"
               onClick={() => {
                  const current = product.sheet.deliverables || [];
                  setProduct({ 
                     ...product, 
                     sheet: { 
                        ...product.sheet, 
                        deliverables: [...current, ""] 
                     } 
                  });
               }}
               className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-[var(--accent-primary)] transition-all flex items-center gap-2"
             >
                <Plus size={12} />
                Adicionar Item
             </button>
          </div>

          <div className="space-y-3">
             {product.sheet.deliverables?.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group">
                   <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[8px] font-black text-[var(--accent-primary)]">
                      {idx + 1}
                   </div>
                   <input 
                      type="text"
                      placeholder="Ex: 1 Sessão Individual de 60min"
                      className="flex-1 bg-transparent border-b border-white/5 py-2 text-[11px] outline-none focus:border-[var(--accent-primary)] transition-all"
                      value={item}
                      onChange={(e) => {
                         const next = [...(product.sheet.deliverables || [])];
                         next[idx] = e.target.value;
                         setProduct({ ...product, sheet: { ...product.sheet, deliverables: next } });
                      }}
                   />
                   <button 
                      type="button"
                      onClick={() => {
                         const next = product.sheet.deliverables?.filter((_: any, i: number) => i !== idx);
                         setProduct({ ...product, sheet: { ...product.sheet, deliverables: next } });
                      }}
                      className="p-2 text-red-500/50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                   >
                      <Trash2 size={14} />
                   </button>
                </div>
             ))}

             {(!product.sheet.deliverables || product.sheet.deliverables.length === 0) && (
                <div className="p-10 border border-dashed border-[var(--border-primary)] rounded-3xl text-center opacity-30">
                   <p className="text-[9px] font-black uppercase tracking-widest">Nenhum entregável cadastrado.</p>
                </div>
             )}
          </div>
       </div>
     </div>
   );
}

function CapabilitiesForm({ product, setProduct }: any) {
  return (
    <div className="space-y-8 max-w-4xl">
       <div className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
             <Zap size={14} />
             <h3 className="text-[10px] font-black uppercase tracking-widest">Ativos do Sistema</h3>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">Vincular Pesquisas (Surveys)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {SURVEY_REGISTRY.map((survey) => {
               const isSelected = product.capabilities.surveys.includes(survey.id);
               return (
                 <button 
                   key={survey.id}
                   type="button"
                   onClick={() => {
                     const scouts = isSelected 
                       ? product.capabilities.surveys.filter((id: string) => id !== survey.id)
                       : [...product.capabilities.surveys, survey.id];
                     setProduct({ ...product, capabilities: { ...product.capabilities, surveys: scouts } });
                   }}
                   className={`p-4 rounded-2xl border text-left transition-all ${isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/20 opacity-60'}`}
                 >
                    <p className="text-[9px] font-black uppercase tracking-widest">{survey.id}</p>
                    <p className="text-[8px] opacity-60 mt-1 line-clamp-1">{survey.title}</p>
                 </button>
               )
             })}
          </div>
       </div>

       <div className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
             <Compass size={14} />
             <h3 className="text-[10px] font-black uppercase tracking-widest">Agendamentos (Calendário)</h3>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">Tipos de Reunião Disponíveis</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {[
               { id: 'onboarding', title: 'Reunião de Onboarding', icon: '🐣' },
               { id: 'devolutiva-analise-comportamental', title: 'Devolutiva de Análise Comportamental', icon: '🎯' },
               { id: 'consultoria-plano-carreira', title: 'Consultoria de Plano de Carreira', icon: '🛣️' },
               { id: 'orientacao-em-grupo', title: 'Orientação em Grupo', icon: '👥' },
               { id: 'orientacao-individual', title: 'Orientação Individual', icon: '👤' },
               { id: 'sessao-coaching', title: 'Sessão de Coaching', icon: '📈' },
               { id: 'sessao-mentoria', title: 'Sessão de Mentoria', icon: '🤝' },
               { id: '1-to-1', title: '1 to 1', icon: '🧠' }
             ].map((event) => {
               const isSelected = product.capabilities.allowedEventTypes.includes(event.id);
               return (
                 <button 
                   key={event.id}
                   type="button"
                   onClick={() => {
                     const current = product.capabilities.allowedEventTypes || [];
                     const next = isSelected 
                       ? current.filter((id: string) => id !== event.id)
                       : [...current, event.id];
                     setProduct({ ...product, capabilities: { ...product.capabilities, allowedEventTypes: next } });
                   }}
                   className={`p-4 rounded-2xl border text-left transition-all relative ${isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/20 opacity-60'}`}
                 >
                    <div className="flex items-center justify-between">
                       <p className="text-[9px] font-black uppercase tracking-widest">{event.id}</p>
                       <span className="text-xs">{event.icon}</span>
                    </div>
                    <p className="text-[8px] opacity-60 mt-1 line-clamp-1">{event.title}</p>
                    
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-[var(--accent-primary)]/10 flex items-center justify-between gap-4">
                         <span className="text-[7px] font-black uppercase tracking-widest text-[var(--accent-primary)]">Sessões Inclusas</span>
                         <input 
                           type="number" 
                           min="0"
                           className="w-12 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-1.5 text-[10px] text-center font-black"
                           value={product.grantedQuotas?.[event.id] || 0}
                           onClick={(e) => e.stopPropagation()}
                           onChange={(e) => {
                             const val = parseInt(e.target.value) || 0;
                             setProduct({ ...product, grantedQuotas: { ...product.grantedQuotas, [event.id]: val } });
                           }}
                         />
                      </div>
                    )}
                 </button>
               )
             })}
          </div>
       </div>
    </div>
  )
}

function WorkflowForm({ product, setProduct }: any) {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
             <Compass size={14} />
             <h3 className="text-[10px] font-black uppercase tracking-widest">Workflow de Entrega</h3>
          </div>
          <button 
            type="button"
            onClick={() => {
               const newStep: WorkflowStep = { id: `step-${Date.now()}`, title: "Nova Etapa", type: 'task', description: "" };
               setProduct({ ...product, workflow: [...product.workflow, newStep] });
            }}
            className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-[var(--accent-primary)] transition-all flex items-center gap-2"
          >
             <Plus size={12} />
             Nova Etapa
          </button>
       </div>

       <div className="space-y-4">
          {product.workflow.map((step: WorkflowStep, idx: number) => (
             <div key={step.id} className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl flex items-center gap-6 group hover:border-[var(--accent-primary)]/50 transition-all">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[9px] font-black">{idx + 1}</div>
                <div className="flex-1 space-y-3">
                   <input 
                     type="text" 
                     value={step.title}
                     placeholder="Título da etapa..."
                     onChange={(e) => {
                        const newWorkflow = [...product.workflow];
                        newWorkflow[idx].title = e.target.value;
                        setProduct({ ...product, workflow: newWorkflow });
                     }}
                     className="bg-transparent border-b border-[var(--border-primary)] text-xs font-bold focus:border-[var(--accent-primary)] outline-none w-full pb-1"
                   />
                </div>
                <button 
                  type="button"
                  onClick={() => {
                     setProduct({ ...product, workflow: product.workflow.filter((sRef: WorkflowStep) => sRef.id !== step.id) });
                  }}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                   <Trash2 size={16} />
                </button>
             </div>
          ))}

          {product.workflow.length === 0 && (
             <div className="p-12 border-2 border-dashed border-[var(--border-primary)] rounded-[2rem] flex flex-col items-center justify-center opacity-30 text-center">
                <Compass size={32} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem etapas definidas</p>
             </div>
          )}
       </div>
    </div>
  )
}
