"use client";

import React, { useMemo, useState } from "react";
import {
  Archive,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FolderSync,
  Play,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { backfillUserDriveAction, type BackfillReport } from "@/actions/admin/backfill-drive";
import { triggerRetroactiveDriveSyncAction } from "@/actions/admin/sync-tools";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";
import { StatTile } from "@/components/admin/StatTile";
import { ClientSelector } from "@/components/admin/ClientSelector";
import AtmosphericLoading from "@/components/shared/AtmosphericLoading";

/**
 * BPlen HUB — Aba Acervo (resgate retroativo).
 *
 * Aciona o espelhamento das respostas que ficaram so no banco enquanto a
 * cobertura dependia de uma allowlist por survey. A logica de resgate vive na
 * server action; aqui e so a superficie que a Gestora usa.
 *
 * Duas travas de seguranca moldam a tela: a simulacao e o estado inicial, e
 * gravar sobre a base inteira exige um segundo clique de confirmacao — sem
 * matricula, uma execucao escreve no acervo de TODOS os membros.
 *
 * Reusa header, StatTiles, loading e alerta canonicos do redesign do admin
 * (mesmo desenho da aba Autenticacoes). Rotulos neutros: nenhuma mencao de
 * infraestrutura (regra 6).
 */

type RunMode = "dry" | "write";

export function DriveBackfillView() {
  const [matricula, setMatricula] = useState("");
  const [mode, setMode] = useState<RunMode>("dry");
  const [running, setRunning] = useState(false);
  const [reports, setReports] = useState<BackfillReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingMassWrite, setConfirmingMassWrite] = useState(false);

  const targetMatricula = matricula.trim();
  const isMassWrite = mode === "write" && !targetMatricula;

  const totals = useMemo(() => {
    const list = reports ?? [];
    return {
      users: list.length,
      surveys: list.reduce((sum, r) => sum + r.surveysWritten, 0),
      forms: list.reduce((sum, r) => sum + r.formsWritten, 0),
      failures: list.reduce((sum, r) => sum + r.failures.length, 0),
    };
  }, [reports]);

  const runBackfill = async () => {
    // Gravacao sobre a base inteira pede confirmacao explicita antes de rodar.
    if (isMassWrite && !confirmingMassWrite) {
      setConfirmingMassWrite(true);
      return;
    }

    setRunning(true);
    setError(null);
    setNotice(null);
    setConfirmingMassWrite(false);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await backfillUserDriveAction(
        { matricula: targetMatricula || undefined, dryRun: mode === "dry" },
        token
      );

      if (res.success && res.reports) {
        setReports(res.reports);
        setNotice(
          mode === "dry"
            ? "Simulação concluída. Nada foi gravado."
            : "Resgate concluído. Os registros já estão nas pastas dos membros."
        );
      } else {
        setError(res.error || "Falha ao executar o resgate.");
      }
    } catch {
      setError("Falha ao executar o resgate.");
    } finally {
      setRunning(false);
    }
  };

  /**
   * Resgate complementar (financeiro, jornada e tarefas). Ferramenta que ja
   * existia no servidor e nunca teve acionamento. Exige matricula e nao tem
   * simulacao — por isso fica separada, com aviso proprio.
   */
  const runComplementarySync = async () => {
    if (!targetMatricula) {
      setError("Informe a matrícula para o resgate complementar.");
      return;
    }

    setRunning(true);
    setError(null);
    setNotice(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError("Sessão administrativa expirada. Entre novamente.");
        return;
      }

      const res = await triggerRetroactiveDriveSyncAction(targetMatricula, token);
      if (res.success) {
        setNotice(res.message || "Resgate complementar concluído.");
      } else {
        setError(res.error || "Falha no resgate complementar.");
      }
    } catch {
      setError("Falha no resgate complementar.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <FunctionalPageHeader
        eyebrow="Pessoas"
        title="Acervo"
        titleAccent="do membro"
        icon={<Archive size={24} />}
        statusTag={{
          label: "Resgate retroativo",
          tone: "accent",
          icon: <FolderSync className="w-3 h-3" />,
        }}
      />

      <p className="text-[var(--text-muted)] text-sm font-medium opacity-70 -mt-4 text-left">
        Espelha no acervo do membro as respostas que ficaram registradas apenas na base. Vale para o que
        foi respondido antes da cobertura automática; o que for enviado a partir de agora já é gravado
        sozinho. Executar de novo não duplica nada.
      </p>

      {/* Alerta de Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500 shadow-2xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
              <X size={18} />
            </div>
            <div className="flex-1">
              <h5 className="text-[10px] font-bold uppercase tracking-widest">Erro na Execução</h5>
              <p className="text-sm font-medium opacity-80">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aviso de sucesso */}
      <AnimatePresence>
        {notice && !error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-4 text-emerald-600 shadow-2xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1">
              <h5 className="text-[10px] font-bold uppercase tracking-widest">Concluído</h5>
              <p className="text-sm font-medium opacity-80">{notice}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <div className="flex flex-wrap items-end gap-4 p-5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] shadow-2xl backdrop-blur-3xl">
        {/* Selecao por busca (nome, matricula ou apelido). O campo de texto livre
            que existia aqui antes exigia a matricula exata, mas exibia uma lupa —
            prometia busca e nao entregava. Reusa o seletor da Jornada do Cliente. */}
        <div className={`flex-1 min-w-[300px] ${running ? "pointer-events-none opacity-50" : ""}`}>
          <ClientSelector
            value={targetMatricula}
            onChange={(selected) => {
              setMatricula(selected);
              setConfirmingMassWrite(false);
            }}
            label="Membro"
            placeholder="Todos os membros"
          />
        </div>

        {targetMatricula ? (
          <button
            onClick={() => {
              setMatricula("");
              setConfirmingMassWrite(false);
            }}
            disabled={running}
            className="flex items-center gap-2 px-4 py-3.5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
          >
            <Users size={14} />
            Todos os membros
          </button>
        ) : null}

        <div className="flex items-center bg-[var(--bg-primary)]/50 p-1.5 rounded-2xl border border-[var(--input-border)] gap-1">
          {([
            { id: "dry", label: "Simulação" },
            { id: "write", label: "Gravar" },
          ] as { id: RunMode; label: string }[]).map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setMode(option.id);
                setConfirmingMassWrite(false);
              }}
              disabled={running}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest whitespace-nowrap disabled:opacity-50 ${
                mode === option.id
                  ? "bg-[var(--accent-start)] text-white shadow-xl shadow-[var(--accent-start)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={runBackfill}
          disabled={running}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[9px] font-bold uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 ${
            confirmingMassWrite
              ? "bg-amber-500 text-white shadow-amber-500/20"
              : "bg-[var(--accent-start)] text-white shadow-[var(--accent-start)]/20 hover:scale-[1.02]"
          }`}
        >
          {confirmingMassWrite ? <ShieldAlert size={14} /> : <Play size={14} />}
          {confirmingMassWrite ? "Confirmar gravação em toda a base" : "Executar"}
        </button>
      </div>

      {/* Aviso de gravacao em massa */}
      <AnimatePresence>
        {confirmingMassWrite && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center gap-4 text-amber-600"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <p className="text-sm font-medium opacity-90">
              Sem matrícula informada, o resgate percorre e grava no acervo de todos os membros. A operação
              é sequencial e pode levar vários minutos. Clique novamente para confirmar.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado */}
      {running ? (
        <AtmosphericLoading label="Carregando Acervo" />
      ) : reports ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="Membros percorridos"
              value={totals.users}
              icon={<FolderSync size={18} />}
              tone="accent"
              detail={mode === "dry" ? "Simulação (nada gravado)" : "Gravação efetiva"}
            />
            <StatTile
              label="Pesquisas resgatadas"
              value={totals.surveys}
              icon={<CheckCircle2 size={18} />}
              tone="success"
            />
            <StatTile
              label="Formulários resgatados"
              value={totals.forms}
              icon={<FileText size={18} />}
              tone="accent"
            />
            <StatTile
              label="Falhas"
              value={totals.failures}
              icon={<AlertTriangle size={18} />}
              tone={totals.failures > 0 ? "danger" : "neutral"}
              detail={totals.failures > 0 ? "Ver detalhe por membro" : "Nenhuma"}
              dot={totals.failures > 0}
            />
          </div>

          <div className="glass overflow-hidden rounded-[2.5rem] border-[var(--border-primary)] shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--input-bg)]/80 border-b border-[var(--border-primary)]">
                    {["Matrícula", "Pesquisas", "Formulários", "Falhas"].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-70"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports
                    .filter((r) => r.surveysFound > 0 || r.formsFound > 0)
                    .map((report) => (
                      <tr
                        key={report.matricula}
                        className="border-b border-[var(--border-primary)]/40 hover:bg-[var(--input-bg)]/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)] font-mono">
                          {report.matricula}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-muted)]">
                          {report.surveysWritten} de {report.surveysFound}
                          {report.surveysSkipped > 0 ? ` (${report.surveysSkipped} sem resposta)` : ""}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[var(--text-muted)]">
                          {report.formsWritten} de {report.formsFound}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {report.failures.length === 0 ? (
                            <span className="text-[var(--text-muted)] opacity-50">-</span>
                          ) : (
                            <span className="text-red-500" title={report.failures.join(" | ")}>
                              {report.failures.length}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resgate complementar */}
      <div className="p-6 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[2rem] shadow-2xl backdrop-blur-3xl space-y-4">
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight uppercase">
            Resgate complementar
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium opacity-80">
            Espelha extrato financeiro, progresso de jornada e tarefas do membro selecionado acima. Exige
            um membro escolhido e não tem simulação: a execução grava direto.
          </p>
        </div>

        <button
          onClick={runComplementarySync}
          disabled={running || !targetMatricula}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-primary)]/50 border border-[var(--input-border)] text-[var(--text-primary)] rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:border-[var(--accent-start)]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FolderSync size={14} />
          Executar resgate complementar
        </button>
      </div>
    </div>
  );
}
