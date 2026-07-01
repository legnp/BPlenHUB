"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  getAdminProducts, 
  uploadAndDryRunAction, 
  syncPortfolioAction 
} from "@/actions/products";
import { syncPortfolioFromFilesAction } from "@/actions/portfolio-commands";
import { Product } from "@/types/products";
import { 
  Package, 
  Settings, 
  Search,
  ExternalLink,
  Clock,
  Database,
  UploadCloud,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage } from "@/lib/utils/errors";

interface ProductDiffAdded {
  slug: string;
  title: string;
  price: number;
}

interface ProductDiffModified {
  slug: string;
  title: string;
  changes: { field: string; old: string | number | undefined; new: string | number | undefined }[];
}

interface ProductDiffArchived {
  slug: string;
  title: string;
}

interface CouponDiffAdded {
  code: string;
  type: string;
  value: number;
}

interface CouponDiffModified {
  code: string;
  changes: { field: string; old: string | number | boolean | undefined; new: string | number | boolean | undefined }[];
}

interface CouponDiffDeactivated {
  code: string;
}

interface DryRunData {
  productsAdded: ProductDiffAdded[];
  productsModified: ProductDiffModified[];
  productsArchived: ProductDiffArchived[];
  couponsAdded: CouponDiffAdded[];
  couponsModified: CouponDiffModified[];
  couponsDeactivated: CouponDiffDeactivated[];
}

export default function PortfolioCommandCenter() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // File states
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [anunciosFile, setAnunciosFile] = useState<File | null>(null);
  const [campanhasFile, setCampanhasFile] = useState<File | null>(null);

  // Drag and drop states
  const [dragActiveField, setDragActiveField] = useState<string | null>(null);

  // Executions states
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunData, setDryRunData] = useState<DryRunData | null>(null);
  const [dryRunError, setDryRunError] = useState<string | null>(null);
  const [dryRunExecuted, setDryRunExecuted] = useState(false);

  // Sync execution states
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [backupCollectionName, setBackupCollectionName] = useState<string | null>(null);
  const [gitSyncLoading, setGitSyncLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getAdminProducts();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);


  const clearFile = (field: string) => {
    if (field === "portfolio") setPortfolioFile(null);
    if (field === "anuncios") setAnunciosFile(null);
    if (field === "campanhas") setCampanhasFile(null);
    setDryRunData(null);
    setDryRunExecuted(false);
  };

  const handleDryRun = async () => {
    setDryRunLoading(true);
    setDryRunError(null);
    setDryRunData(null);
    setSyncSuccessMessage(null);

    try {
      const formData = new FormData();
      if (portfolioFile) formData.append("portfolioFile", portfolioFile);
      if (anunciosFile) formData.append("anunciosFile", anunciosFile);
      if (campanhasFile) formData.append("campanhasFile", campanhasFile);

      const result = await uploadAndDryRunAction(formData);

      if (result.success) {
        setDryRunData({
          productsAdded: result.productsAdded || [],
          productsModified: result.productsModified || [],
          productsArchived: result.productsArchived || [],
          couponsAdded: result.couponsAdded || [],
          couponsModified: result.couponsModified || [],
          couponsDeactivated: result.couponsDeactivated || []
        });
        setDryRunExecuted(true);
      } else {
        setDryRunError(result.error || "Erro desconhecido ao executar Dry-Run");
      }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setDryRunError(errorObj.message);
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleSyncCommit = async () => {
    if (!dryRunExecuted) return;
    setSyncLoading(true);
    setSyncSuccessMessage(null);

    try {
      const result = await syncPortfolioAction();
      if (result.success) {
        setSyncSuccessMessage(result.message || "Sincronizacao concluida com sucesso.");
        setBackupCollectionName(result.backedUpTo ?? null);
        
        // Reload products list
        const updatedProducts = await getAdminProducts();
        setProducts(updatedProducts);

        // Reset files and dry run state
        setPortfolioFile(null);
        setAnunciosFile(null);
        setCampanhasFile(null);
        setDryRunData(null);
        setDryRunExecuted(false);
      } else {
        setDryRunError(result.error || "Erro ao commitar sincronizacao.");
      }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setDryRunError(errorObj.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleGitSync = async () => {
    if (!confirm("Isso atualizará o banco de dados com os dados dos arquivos portfolio_payload.json e campanhas_payload.json presentes no repositório. Deseja continuar?")) return;
    
    setGitSyncLoading(true);
    setSyncSuccessMessage(null);
    setDryRunError(null);

    try {
      const result = await syncPortfolioFromFilesAction();
      if (result.success) {
        setSyncSuccessMessage(result.message || "Sincronização via repositório concluída.");
        const updatedProducts = await getAdminProducts();
        setProducts(updatedProducts);
      } else {
        setDryRunError(result.error || "Erro na sincronização via repositório.");
      }
    } catch (err: unknown) {
      setDryRunError(getErrorMessage(err));
    } finally {
      setGitSyncLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasStagedFiles = portfolioFile !== null || anunciosFile !== null || campanhasFile !== null;

  // Calculate stats
  const activeProductsCount = products.filter(p => p.status === "active").length;
  const archivedProductsCount = products.filter(p => p.status === "archived").length;

  return (
    <div className="space-y-10 animate-fade-in pb-24 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Estrategico */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--border-primary)] pb-8">
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
              Sincronia Soberana Ativa
            </span>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            PORTFOLIO <span className="text-[var(--accent-start)] italic ml-1">Command Center</span>
          </h1>
          <p className="text-[var(--text-muted)] text-[11px] max-w-2xl leading-relaxed opacity-80">
            Painel soberano de auditoria, versionamento e sincronizacao de dados comerciais, de marketing e campanhas. A edicao direta de banco de dados foi travada para mitigar divergencias operacionais.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Ultima Sincronia: {loading ? "Carregando..." : products.length > 0 ? "Ativa" : "Sem dados"}
          </div>
          
          <button 
            onClick={handleGitSync}
            disabled={gitSyncLoading || loading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-start)]/10 hover:bg-[var(--accent-start)]/20 border border-[var(--accent-start)]/20 rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] transition-all disabled:opacity-50"
          >
            {gitSyncLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            Sincronizar via Repositório (Git)
          </button>
        </div>
      </header>

      {/* Grid de Operacao */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel de Upload (Sincronia em Massa) */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="p-8 bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)] rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Sincronizacao de Arquivos Locais</h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Insira os arquivos gerados pelas areas comercial e copywritter</p>
              </div>
              <ShieldCheck className="text-emerald-500 w-5 h-5 opacity-80" />
            </div>

            {/* Dropzones Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Portfolio File Dropzone */}
              <FileDropzone 
                id="portfolio"
                label="portfolio_bplen.xlsx"
                description="Dados de precificacao e checkpoints"
                file={portfolioFile}
                dragActive={dragActiveField === "portfolio"}
                onDragStateChange={(active) => setDragActiveField(active ? "portfolio" : null)}
                onFileSelected={(file) => setPortfolioFile(file)}
                onClear={() => clearFile("portfolio")}
                icon={<FileSpreadsheet className="w-6 h-6 text-emerald-500" />}
              />

              {/* Anuncios File Dropzone */}
              <FileDropzone 
                id="anuncios"
                label="anuncios_bplen.docx"
                description="Copywriting de anuncios e FAQ"
                file={anunciosFile}
                dragActive={dragActiveField === "anuncios"}
                onDragStateChange={(active) => setDragActiveField(active ? "anuncios" : null)}
                onFileSelected={(file) => setAnunciosFile(file)}
                onClear={() => clearFile("anuncios")}
                icon={<FileText className="w-6 h-6 text-indigo-400" />}
              />

              {/* Campanhas File Dropzone */}
              <FileDropzone 
                id="campanhas"
                label="campanhas_bplen.xlsx"
                description="Ofertas sazonais e cupons"
                file={campanhasFile}
                dragActive={dragActiveField === "campanhas"}
                onDragStateChange={(active) => setDragActiveField(active ? "campanhas" : null)}
                onFileSelected={(file) => setCampanhasFile(file)}
                onClear={() => clearFile("campanhas")}
                icon={<FileSpreadsheet className="w-6 h-6 text-pink-500" />}
              />

            </div>

            {/* Acoes de Sincronia */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-[var(--border-primary)]">
              {hasStagedFiles && (
                <button 
                  onClick={() => {
                    setPortfolioFile(null);
                    setAnunciosFile(null);
                    setCampanhasFile(null);
                    setDryRunData(null);
                    setDryRunExecuted(false);
                    setDryRunError(null);
                  }}
                  className="px-6 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-all w-full sm:w-auto"
                >
                  Limpar Palco
                </button>
              )}
              <button 
                onClick={handleDryRun}
                disabled={!hasStagedFiles || dryRunLoading || syncLoading}
                className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] shadow-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {dryRunLoading ? (
                  <>
                    <RefreshCw className="animate-spin w-3.5 h-3.5" />
                    Rodando Sandbox...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    Simular Alteracoes (Dry-Run)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Widget Dry-Run Sandbox Diff Comparer */}
          <AnimatePresence>
            {dryRunLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-12 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="w-8 h-8 border-2 border-t-[var(--accent-start)] border-transparent rounded-full animate-spin" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Processador Sandbox Ativo</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Carregando planilhas de precificacao e convertendo copywriting via subprocesso Python...</p>
                </div>
              </motion.div>
            )}

            {dryRunError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
              >
                <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Falha no Processamento</h4>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-mono whitespace-pre-wrap">{dryRunError}</p>
                </div>
              </motion.div>
            )}

            {dryRunExecuted && dryRunData && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Preview Comparativo (Dry-Run Sandbox)</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Compare os novos dados processados com o banco de dados antes de commitar.</p>
                  </div>
                  <button
                    onClick={handleSyncCommit}
                    disabled={syncLoading}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                  >
                    {syncLoading ? (
                      <>
                        <RefreshCw className="animate-spin w-3.5 h-3.5" />
                        Salvando Lote...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aplicar Alteracoes em Producao
                      </>
                    )}
                  </button>
                </div>

                {/* Diff Visualizations */}
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  
                  {/* Added Items */}
                  {(dryRunData.productsAdded.length > 0 || dryRunData.couponsAdded.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Novidades para Insercao (+)</h4>
                      <div className="space-y-2">
                        {dryRunData.productsAdded.map(p => (
                          <div key={p.slug} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between text-[11px]">
                            <span className="font-bold uppercase tracking-wide text-emerald-400">Servico: {p.title}</span>
                            <span className="font-mono text-emerald-500">R$ {p.price.toFixed(2)}</span>
                          </div>
                        ))}
                        {dryRunData.couponsAdded.map(c => (
                          <div key={c.code} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between text-[11px]">
                            <span className="font-bold uppercase tracking-wide text-emerald-400">Cupom: {c.code}</span>
                            <span className="font-mono text-emerald-500">{c.type === "percentage" ? `${c.value}% OFF` : `R$ ${c.value} OFF`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modified Items */}
                  {(dryRunData.productsModified.length > 0 || dryRunData.couponsModified.length > 0) && (
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-500">Alteracoes Detectadas (Delta)</h4>
                      <div className="space-y-3">
                        {dryRunData.productsModified.map(p => (
                          <div key={p.slug} className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                              <span className="font-bold text-[11px] uppercase text-amber-400">{p.title}</span>
                              <span className="text-[9px] font-mono opacity-50">/{p.slug}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {p.changes.map((ch, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
                                  <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[8px]">{ch.field}:</span>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-red-400 line-through bg-red-500/5 px-1.5 py-0.5 rounded">{ch.old?.toString() || "vazio"}</span>
                                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                                    <span className="text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">{ch.new?.toString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {dryRunData.couponsModified.map(c => (
                          <div key={c.code} className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                              <span className="font-bold text-[11px] uppercase text-amber-400">Cupom: {c.code}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {c.changes.map((ch, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
                                  <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[8px]">{ch.field}:</span>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-red-400 line-through bg-red-500/5 px-1.5 py-0.5 rounded">{ch.old?.toString() || "vazio"}</span>
                                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                                    <span className="text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">{ch.new?.toString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Archived / Deactivated Items */}
                  {(dryRunData.productsArchived.length > 0 || dryRunData.couponsDeactivated.length > 0) && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-red-400">Desativacao / Arquivamento (-)</h4>
                      <div className="space-y-2">
                        {dryRunData.productsArchived.map(p => (
                          <div key={p.slug} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center justify-between text-[11px]">
                            <span className="font-bold uppercase tracking-wide text-red-400">Servico: {p.title}</span>
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[8px] font-bold uppercase tracking-wider">Sera Arquivado</span>
                          </div>
                        ))}
                        {dryRunData.couponsDeactivated.map(c => (
                          <div key={c.code} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center justify-between text-[11px]">
                            <span className="font-bold uppercase tracking-wide text-red-400">Cupom: {c.code}</span>
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[8px] font-bold uppercase tracking-wider">Ficara Inativo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dryRunData.productsAdded.length === 0 && 
                   dryRunData.productsModified.length === 0 && 
                   dryRunData.productsArchived.length === 0 && 
                   dryRunData.couponsAdded.length === 0 && 
                   dryRunData.couponsModified.length === 0 && 
                   dryRunData.couponsDeactivated.length === 0 && (
                     <div className="p-6 border border-dashed border-[var(--border-primary)] rounded-2xl text-center">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma alteracao detectada. O portfolio local esta em perfeita sincronia com o banco de dados.</p>
                     </div>
                  )}

                </div>
              </motion.div>
            )}

            {syncSuccessMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mt-0.5">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Sincronizacao Efetuada com Sucesso</h3>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{syncSuccessMessage}</p>
                    {backupCollectionName && (
                      <p className="text-[9px] text-[var(--text-muted)] font-mono opacity-80 mt-2">
                        Backup preventivo criado na colecao Firestore: <span className="text-emerald-400 font-bold">{backupCollectionName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Status Lateral */}
        <div className="space-y-6 text-left">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4">
            <StatCard 
              label="Produtos Ativos" 
              value={loading ? "--" : activeProductsCount.toString()} 
              icon={<Package size={20} />} 
              status={`${archivedProductsCount} arquivados`}
            />
            <StatCard 
              label="Seguranca Operacional" 
              value="100%" 
              icon={<Lock size={20} />} 
              status="Edicao ad-hoc bloqueada"
            />
          </div>

          {/* Instrucoes de Seguranca */}
          <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] space-y-4 text-[11px]">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Diretrizes de Governança
            </h4>
            <div className="space-y-3 leading-relaxed text-[var(--text-muted)]">
              <p>
                1. <strong>Alterações Comerciais:</strong> Sempre edite os preços, parcelas e checkpoints na planilha <code className="bg-red-500/5 text-[var(--accent-start)] px-1 py-0.5 rounded font-mono">portfolio_bplen.xlsx</code>.
              </p>
              <p>
                2. <strong>Marketing e Copy:</strong> Ajuste kicker, descrições longas, FAQ e workflows de entrega no arquivo Word <code className="bg-red-500/5 text-[var(--accent-start)] px-1 py-0.5 rounded font-mono">anuncios_bplen.docx</code>.
              </p>
              <p>
                3. <strong>Vigência e Campanhas:</strong> Gerencie as promoções, cupons de desconto (ex: NATAL10) e ofertas dinâmicas no arquivo de campanhas <code className="bg-red-500/5 text-[var(--accent-start)] px-1 py-0.5 rounded font-mono">campanhas_bplen.xlsx</code>.
              </p>
              <p>
                4. <strong>Ficha Técnica e Drive:</strong> O sistema mantém sincronia assíncrona automática com as pastas e fichas técnicas no Google Drive.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Tabela de Produtos */}
      <section className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 border-t border-[var(--border-primary)] pt-10">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] opacity-80">Catálogo Atualizado ({products.length})</h2>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Lista de servicos e pacotes indexados no cache do BPlen HUB</p>
          </div>
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
             <input 
               type="text" 
               placeholder="Buscar produto..."
               className="pl-12 pr-6 py-3 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-full text-[10px] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none min-w-[280px]"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] opacity-30 gap-4">
            <div className="w-6 h-6 border-2 border-t-[var(--accent-primary)] border-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Ecossistema...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] text-center px-12">
             <Package size={32} className="text-[var(--text-muted)] opacity-20 mb-4" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => (
              <ProductItem key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

// Dropzone Sub-Component (No Emojis)
interface FileDropzoneProps {
  id: string;
  label: string;
  description: string;
  file: File | null;
  dragActive: boolean;
  onDragStateChange: (active: boolean) => void;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  icon: React.ReactNode;
}

function FileDropzone({
  id,
  label,
  description,
  file,
  dragActive,
  onDragStateChange,
  onFileSelected,
  onClear,
  icon
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-5 rounded-2xl border-2 border-dashed transition-all relative flex flex-col items-center text-center justify-between min-h-[160px] ${
        file 
          ? "border-emerald-500/20 bg-emerald-500/[0.02]" 
          : dragActive 
            ? "border-[var(--accent-start)] bg-[var(--accent-start)]/5 scale-[1.02]" 
            : "border-[var(--border-primary)] hover:border-[var(--text-muted)] bg-[var(--input-bg)]/20"
      }`}
    >
      <input 
        ref={inputRef}
        type="file"
        id={`input-${id}`}
        className="hidden"
        accept={id === "anuncios" ? ".docx" : ".xlsx"}
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center justify-center space-y-2 mt-2">
        <div className="p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-primary)]">
            {file ? file.name : label}
          </p>
          <p className="text-[8px] text-[var(--text-muted)] max-w-[150px] leading-relaxed mx-auto">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : description}
          </p>
        </div>
      </div>

      <div className="w-full pt-3 mt-3 border-t border-[var(--border-primary)]/40 flex items-center justify-center">
        {file ? (
          <button 
            onClick={onClear}
            className="text-[8px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 size={10} />
            Remover
          </button>
        ) : (
          <button 
            onClick={() => inputRef.current?.click()}
            className="text-[8px] font-black uppercase tracking-widest text-[var(--accent-start)] hover:text-white transition-all flex items-center gap-1"
          >
            <UploadCloud size={10} />
            Escolher Arquivo
          </button>
        )}
      </div>
    </div>
  );
}

// Stats Card Sub-Component (No Emojis)
function StatCard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status: string }) {
  return (
    <div className="p-6 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[2rem] flex items-center justify-between group hover:border-[var(--accent-start)]/30 transition-all">
      <div className="space-y-1 text-left">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">{label}</p>
        <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{value}</p>
        <p className="text-[8px] font-semibold text-[var(--text-muted)] uppercase tracking-wide opacity-80 mt-1">{status}</p>
      </div>
      <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-muted)] group-hover:text-[var(--accent-start)] transition-colors">
        {icon}
      </div>
    </div>
  );
}

// Product Item Row (No Emojis)
function ProductItem({ product }: { product: Product }) {
  return (
    <div className="p-5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all hover:border-[var(--border-primary)]/80">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-[var(--input-bg)] overflow-hidden border border-[var(--border-primary)] flex items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: `url(${product.sheet?.coverImage})` }}>
           {!product.sheet?.coverImage && <Package className="text-[var(--text-muted)] opacity-20" />}
           <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
        </div>
        
        <div className="space-y-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{product.title}</h3>
            {product.isStepJourney && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-start)]/10 border border-[var(--accent-start)]/20 text-[var(--accent-start)] text-[7px] font-bold uppercase tracking-widest">
                Journey Step #{product.order}
              </span>
            )}
            {product.status === "archived" && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[7px] font-bold uppercase tracking-widest">
                Arquivado
              </span>
            )}
            {product.originalPrice && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[7px] font-bold uppercase tracking-widest">
                Campanha Ativa
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
            <span className="flex items-center gap-1.5"><Clock size={12} /> {product.status}</span>
            <span className="flex items-center gap-1.5 italic opacity-40">/{product.slug}</span>
            {product.serviceCode && <span className="opacity-60">{product.serviceCode}</span>}
            <span className="opacity-80">R$ {product.price?.toFixed(2)} (Cartao) | R$ {product.pricePix?.toFixed(2)} (PIX)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <Link 
          href={`/admin/products/${product.id}`}
          className="p-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--accent-start)] hover:border-[var(--accent-start)]/30 transition-all flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
        >
          <Settings size={14} />
          Ficha Tecnica
        </Link>
        <Link 
          href={`/servicos/people/${product.slug}`}
          target="_blank"
          className="p-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
        >
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
