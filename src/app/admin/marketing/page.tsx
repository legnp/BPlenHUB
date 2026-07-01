"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminCouponsList, saveCouponAction } from "@/actions/coupons";
import { generateCouponBatchAction, getAdminCouponsV2Action } from "@/actions/coupon-v2";
import { Coupon, DiscountType } from "@/types/marketing";
import { 
  Plus, 
  Trash2, 
  Ticket, 
  Search, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Settings2,
  Lock,
  Percent,
  Layers,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassModal from "@/components/ui/GlassModal";

interface V2Batch {
  batchId: string;
  service: string;
  discount: number;
  quantityTotal: number;
  quantityUsed: number;
  expiresAfterDays: number;
  terms: string;
  createdAt: string;
}

interface V2Coupon {
  couponId: string;
  batchId: string;
  code: string;
  isRedeemed: boolean;
  isUsedInOrder: boolean;
}

export default function MarketingAdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"v1" | "v2">("v1");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // V1 Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Partial<Coupon> | null>(null);

  // V2 Lotes (Batches) State
  const [batches, setBatches] = useState<V2Batch[]>([]);
  const [v2Coupons, setV2Coupons] = useState<V2Coupon[]>([]);
  const [isBatchCreatorOpen, setIsBatchCreatorOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states for V2 Batch generation
  const [v2Service, setV2Service] = useState("posicionamento-profissional");
  const [v2Discount, setV2Discount] = useState(70); // Em porcentagem (ex: 70)
  const [v2Quantity, setV2Quantity] = useState(30);
  const [v2ExpiresAfterDays, setV2ExpiresAfterDays] = useState(7);
  const [v2Terms, setV2Terms] = useState(
    "1. Fase de Teste - Esta funcionalidade esta em periodo beta (V01.01). Voce reconhece que podem ocorrer inconsistencias e que seu papel e reportar eventuais problemas.\n2. Uso Unico e Intransferivel - Cada cupom esta vinculado ao seu CPF. O uso e estritamente pessoal.\n3. Validade - O prazo de validade comeca a contar a partir do momento em que voce aceita estes termos e efetua o resgate."
  );

  const fetchCoupons = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    
    // Fetch V1
    const resultV1 = await getAdminCouponsList(token);
    if (resultV1.success && resultV1.data) {
      setCoupons(resultV1.data);
    }

    // Fetch V2
    const resultV2 = await getAdminCouponsV2Action(token);
    if (resultV2.success && resultV2.data) {
      const typedData = resultV2.data as { batches: V2Batch[]; coupons: V2Coupon[] };
      setBatches(typedData.batches || []);
      setV2Coupons(typedData.coupons || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, [user]);

  const handleCreateNew = () => {
    setSelectedCoupon({
      code: "",
      type: "percentage",
      value: 0,
      active: true,
      usageCount: 0,
      usageLimit: 0
    });
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCoupon || !user) return;
    const token = await user.getIdToken();
    const result = await saveCouponAction(selectedCoupon, token);
    if (result.success) {
      setIsEditorOpen(false);
      fetchCoupons();
    } else {
      alert("Erro ao salvar cupom: " + result.error);
    }
  };

  const handleGenerateBatch = async () => {
    if (!user) return;
    setLoading(true);
    const token = await user.getIdToken();

    const result = await generateCouponBatchAction({
      service: v2Service,
      discount: v2Discount / 100,
      quantity: v2Quantity,
      expiresAfterDays: v2ExpiresAfterDays,
      terms: v2Terms,
    }, token);

    if (result.success) {
      setIsBatchCreatorOpen(false);
      fetchCoupons();
    } else {
      alert("Erro ao gerar lote de cupons: " + result.error);
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter(b => 
    b.service.toLowerCase().includes(search.toLowerCase()) ||
    b.batchId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            CUPONS E <span className="text-[var(--accent-start)] italic">OFERTAS</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium opacity-70">
            Gestao integrada de cupons e lotes de descontos premium.
          </p>
        </div>

        {activeTab === "v1" ? (
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-tr from-[var(--accent-start)] to-[var(--accent-end)] rounded-2xl font-bold text-[10px] uppercase tracking-widest text-white transition-all shadow-lg hover:translate-y-[-2px] active:scale-[0.98]"
          >
            <Plus size={16} /> Criar Novo Cupom
          </button>
        ) : (
          <button 
            onClick={() => setIsBatchCreatorOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-tr from-[#ff0080] to-[var(--accent-end)] rounded-2xl font-bold text-[10px] uppercase tracking-widest text-white transition-all shadow-lg hover:translate-y-[-2px] active:scale-[0.98]"
          >
            <Plus size={16} /> Gerar Lote Premium (V2)
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-primary)] gap-8">
        <button
          onClick={() => setActiveTab("v1")}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "v1"
              ? "border-b-2 border-[var(--accent-start)] text-[var(--text-primary)]"
              : "text-[var(--text-muted)] opacity-50 hover:opacity-100"
          }`}
        >
          Cupons Simples (V1)
        </button>
        <button
          onClick={() => setActiveTab("v2")}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "v2"
              ? "border-b-2 border-[#ff0080] text-[var(--text-primary)]"
              : "text-[var(--text-muted)] opacity-50 hover:opacity-100"
          }`}
        >
          Lotes Premium (V2 - CPF)
        </button>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <MetricCard 
           icon={<Hash size={18} />} 
           label="Cupons V1 Ativos" 
           value={coupons.filter(c => c.active).length} 
         />
         <MetricCard 
           icon={<Layers size={18} />} 
           label="Lotes V2 Criados" 
           value={batches.length} 
         />
         <MetricCard 
           icon={<Percent size={18} />} 
           label="Total Resgates V2" 
           value={v2Coupons.filter(c => c.isRedeemed).length} 
         />
      </div>

      {/* SEARCH AND TABLES */}
      {activeTab === "v1" ? (
        // V1 Coupons View
        <div className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-sm">
           <div className="p-5 border-b border-[var(--border-primary)] flex items-center gap-4 bg-[var(--accent-soft)]/20">
              <Search size={16} className="text-[var(--text-muted)] opacity-40" />
              <input 
                 type="text" 
                 placeholder="Buscar por codigo (ex: BPLEN20)..."
                 className="bg-transparent outline-none text-xs font-bold uppercase tracking-widest w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-40" 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/40">
                       <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Cupom</th>
                       <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Tipo / Valor</th>
                       <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Uso</th>
                       <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Status</th>
                       <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 text-right">Acoes</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredCoupons.map((coupon) => (
                       <tr key={coupon.id} className="border-b border-[var(--border-primary)] hover:bg-[var(--accent-soft)] transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent-start)]/5 flex items-center justify-center text-[var(--accent-start)] font-bold text-xs border border-[var(--accent-start)]/10">
                                   {coupon.code.slice(0, 2)}
                                </div>
                                <span className="font-bold text-xs tracking-tight uppercase text-[var(--text-primary)]">{coupon.code}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-3 py-1 bg-[var(--accent-soft)] rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--accent-start)]">
                                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `R$ ${coupon.value} OFF`}
                             </span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="space-y-1">
                                <div className="w-24 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                   <div 
                                      className="h-full bg-[var(--accent-start)]" 
                                      style={{ width: `${Math.min(100, (coupon.usageCount / (coupon.usageLimit || 1)) * 100)}%` }} 
                                   />
                                </div>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] opacity-60">{coupon.usageCount} / {coupon.usageLimit || '∞'}</p>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             {coupon.active ? (
                                <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-bold uppercase tracking-widest">
                                   <CheckCircle2 size={12} /> Ativo
                                </div>
                             ) : (
                                <div className="flex items-center gap-2 text-[var(--text-muted)] opacity-40 text-[9px] font-bold uppercase tracking-widest">
                                   <AlertCircle size={12} /> Inativo
                                </div>
                             )}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button 
                               onClick={() => { setSelectedCoupon(coupon); setIsEditorOpen(true); }}
                               className="p-3 hover:bg-[var(--accent-soft)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent-start)] transition-all"
                             >
                                <Settings2 size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        // V2 Lotes Premium View
        <div className="space-y-6">
          {filteredBatches.map((batch) => {
            const batchCoupons = v2Coupons.filter(c => c.batchId === batch.batchId);
            return (
              <div key={batch.batchId} className="bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border-primary)]">
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-[#ff0080]/10 text-[#ff0080] rounded-full text-[9px] font-black uppercase tracking-wider">
                      Lote Premium
                    </span>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {batch.service === "pacote-embaixador" ? "Pacote EMBAIXADOR BPLEN" : batch.service === "posicionamento-profissional" ? "Posicionamento de Carreira" : `Servico: ${batch.service}`}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">ID do Lote: {batch.batchId}</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-45">Desconto</p>
                      <p className="text-xl font-black text-emerald-500">{(batch.discount * 100).toFixed(0)}% OFF</p>
                    </div>
                    <div className="text-right border-l border-[var(--border-primary)] pl-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-45">Validade</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{batch.expiresAfterDays} dias</p>
                    </div>
                  </div>
                </div>

                {/* Codes grid */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                    Codigos Gerados ({batch.quantityUsed} / {batch.quantityTotal} Resgatados)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {batchCoupons.map((coupon) => (
                      <div 
                        key={coupon.couponId}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          coupon.isUsedInOrder
                            ? "bg-gray-500/5 border-gray-500/10 text-gray-500 line-through"
                            : coupon.isRedeemed
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-500"
                            : "bg-[var(--bg-primary)]/50 border-[var(--border-primary)] hover:border-[#ff0080]/30 text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="text-xs font-black tracking-wider">{coupon.code}</span>
                        <button
                          disabled={coupon.isUsedInOrder}
                          onClick={() => handleCopyCode(coupon.code)}
                          className="text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          {copiedCode === coupon.code ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor de Cupons V1 */}
      <GlassModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="Configuracao de Oferta"
        subtitle="Gerencie os parametros estrategicos do cupom de desconto."
      >
        {selectedCoupon && (
          <div className="space-y-8 p-2 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Codigo do Cupom</label>
                  <input 
                     type="text" 
                     className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-4.5 text-sm font-bold uppercase outline-none focus:border-[var(--accent-start)] transition-all tracking-widest text-[var(--text-primary)]"
                     value={selectedCoupon.code}
                     onChange={(e) => setSelectedCoupon({...selectedCoupon, code: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Tipo de Desconto</label>
                  <select 
                     className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-4.5 text-sm font-bold outline-none focus:border-[var(--accent-start)] appearance-none text-[var(--text-primary)] px-6"
                     value={selectedCoupon.type}
                     onChange={(e) => setSelectedCoupon({...selectedCoupon, type: e.target.value as DiscountType})}
                  >
                     <option value="percentage">Porcentagem (%)</option>
                     <option value="fixed">Valor Fixo (R$)</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Valor do Desconto</label>
                  <input 
                     type="number" 
                     className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-4.5 text-sm font-bold outline-none text-[var(--text-primary)]"
                     value={selectedCoupon.value}
                     onChange={(e) => setSelectedCoupon({...selectedCoupon, value: parseFloat(e.target.value)})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Limite de Uso (0 = ∞)</label>
                  <input 
                     type="number" 
                     className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-4.5 text-sm font-bold outline-none text-[var(--text-primary)]"
                     value={selectedCoupon.usageLimit}
                     onChange={(e) => setSelectedCoupon({...selectedCoupon, usageLimit: parseInt(e.target.value)})}
                  />
               </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-[var(--border-primary)]">
               <button 
                 onClick={() => setSelectedCoupon({...selectedCoupon, active: !selectedCoupon.active})}
                 className={`flex-1 p-4.5 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${selectedCoupon.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-primary)] font-bold'}`}
               >
                  Status: {selectedCoupon.active ? "Ativado" : "Desativado"}
               </button>
               <button 
                 onClick={handleSave}
                 className="flex-[2] p-4.5 bg-gradient-to-tr from-[var(--accent-start)] to-[var(--accent-end)] rounded-2xl text-[9px] font-bold uppercase tracking-widest text-white shadow-xl hover:translate-y-[-2px] active:scale-[0.98] transition-all"
               >
                  Salvar Configuracoes
               </button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Lote V2 Creator Modal */}
      <GlassModal
        isOpen={isBatchCreatorOpen}
        onClose={() => setIsBatchCreatorOpen(false)}
        title="Gerar Lote de Cupons Premium"
        subtitle="Cria cupons com regras de CPF, termos aceitos e Drive integrado."
      >
        <div className="space-y-6 text-left p-2">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Servico Alvo</label>
            <select
              className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#ff0080] text-[var(--text-primary)]"
              value={v2Service}
              onChange={(e) => setV2Service(e.target.value)}
            >
              <option value="pacote-embaixador">Pacote EMBAIXADOR BPLEN (100% OFF)</option>
              <option value="posicionamento-profissional">Posicionamento de Carreira</option>
              <option value="pacote-junior-pleno-senior-lider">Plano Junior / Pleno / Senior / Lider</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Desconto (%)</label>
              <input
                type="number"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[#ff0080]"
                value={v2Discount}
                onChange={(e) => setV2Discount(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Quantidade</label>
              <input
                type="number"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[#ff0080]"
                value={v2Quantity}
                onChange={(e) => setV2Quantity(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Validade apos Resgate (em dias)</label>
            <input
              type="number"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[#ff0080]"
              value={v2ExpiresAfterDays}
              onChange={(e) => setV2ExpiresAfterDays(parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">Termos e Condicoes do Lote (V01.01)</label>
            <textarea
              rows={4}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-2xl p-4 text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[#ff0080] leading-relaxed"
              value={v2Terms}
              onChange={(e) => setV2Terms(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerateBatch}
            className="w-full py-4.5 bg-gradient-to-tr from-[#ff0080] to-[var(--accent-end)] rounded-2xl text-[9px] font-bold uppercase tracking-widest text-white shadow-xl hover:translate-y-[-2px] active:scale-[0.98] transition-all"
          >
            Gerar Lote Agora
          </button>
        </div>
      </GlassModal>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
   return (
      <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] flex items-center justify-between group hover:border-[var(--accent-start)]/30 transition-all shadow-sm">
         <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">{label}</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
         </div>
         <div className="p-3 bg-[var(--accent-start)]/5 rounded-2xl text-[var(--text-muted)] group-hover:text-[var(--accent-start)] transition-colors">
            {icon}
         </div>
      </div>
   );
}
