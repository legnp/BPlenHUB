"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, ChevronDown, Search, Loader2, Plus, Trash2, Check, Wrench } from "lucide-react";
import { getAdminUsersList } from "@/actions/users-admin";
import {
  getClientJourneyInstrumentsAction,
  assignDynamicSubstepAction,
  removeDynamicSubstepAction,
} from "@/actions/journey";
import { listInstruments, findInstrument } from "@/lib/journey/instrument-registry";
import { AdminUser } from "@/types/users";
import { ClientJourneyInstruments } from "@/types/journey";

/**
 * BPlen HUB — Instrumentos do Cliente (modularizacao de instrumentos).
 *
 * Permite pendurar uma survey ou formulario de F&S num checkpoint especifico da
 * jornada de UM cliente (ex.: a Triade do Tempo so para o cliente X, na etapa Y do
 * MentoCoach). O instrumento entra como subcheckpoint do checkpoint escolhido.
 *
 * Duas consequencias sao intencionais e estao avisadas na interface:
 * 1. A etapa volta a ficar em aberto e, pela regra global de sequencia, as etapas
 *    seguintes travam ate a conclusao.
 * 2. Se o cliente ja respondeu o mesmo instrumento em outro ponto da jornada, o motor
 *    de conclusao cruzada marca este como concluido — nao se pede a mesma coisa duas
 *    vezes.
 */

const INSTRUMENTS = listInstruments();

export function ClientInstrumentsView() {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedMatricula, setSelectedMatricula] = useState<string>("");

  const [journey, setJourney] = useState<ClientJourneyInstruments[]>([]);
  const [loadingJourney, setLoadingJourney] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);

  // Formulario de atribuicao, por etapa.
  const [openStageId, setOpenStageId] = useState<string>("");
  const [parentCheckpointId, setParentCheckpointId] = useState<string>("");
  const [instrumentRef, setInstrumentRef] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [removingId, setRemovingId] = useState<string>("");

  useEffect(() => {
    setLoadingUsers(true);
    getAdminUsersList()
      .then((res) => {
        if (res.success && res.data) setUsersList(res.data);
      })
      .catch((err) => console.error("Erro ao carregar lista de usuarios:", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const loadJourney = useCallback(async (matricula: string) => {
    if (!matricula) return;
    setLoadingJourney(true);
    try {
      const res = await getClientJourneyInstrumentsAction(matricula);
      if (res.success && res.data) {
        setJourney(res.data);
      } else {
        setJourney([]);
        setFeedback({ kind: "erro", text: res.message || "Não foi possível carregar a jornada." });
      }
    } finally {
      setLoadingJourney(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatricula) loadJourney(selectedMatricula);
  }, [selectedMatricula, loadJourney]);

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUser = usersList.find((u) => u.matricula === selectedMatricula);

  function openAssignForm(stageId: string) {
    const next = openStageId === stageId ? "" : stageId;
    setOpenStageId(next);
    setParentCheckpointId("");
    setInstrumentRef("");
    setCustomTitle("");
    setFeedback(null);
  }

  async function handleAssign(stageId: string) {
    const instrument = findInstrument(instrumentRef);
    if (!instrument || !parentCheckpointId || !selectedMatricula) return;

    setSaving(true);
    setFeedback(null);
    try {
      const res = await assignDynamicSubstepAction(selectedMatricula, stageId, parentCheckpointId, {
        title: customTitle.trim() || instrument.title,
        type: instrument.type,
        referenceId: instrument.referenceId,
        description: "Instrumento atribuído pela equipe BPlen",
      });

      if (res.success) {
        setFeedback({ kind: "ok", text: res.message });
        setOpenStageId("");
        setParentCheckpointId("");
        setInstrumentRef("");
        setCustomTitle("");
        await loadJourney(selectedMatricula);
      } else {
        setFeedback({ kind: "erro", text: res.message });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(stageId: string, subStepId: string, title: string) {
    if (!selectedMatricula) return;
    if (!window.confirm(`Remover "${title}" da jornada deste cliente?`)) return;

    setRemovingId(subStepId);
    setFeedback(null);
    try {
      const res = await removeDynamicSubstepAction(selectedMatricula, stageId, subStepId);
      setFeedback({ kind: res.success ? "ok" : "erro", text: res.message });
      if (res.success) await loadJourney(selectedMatricula);
    } finally {
      setRemovingId("");
    }
  }

  return (
    <div className="space-y-8 text-left">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[var(--accent-start)]/10 rounded-2xl border border-[var(--accent-start)]/20 text-[var(--accent-start)]">
          <Wrench size={16} />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
            Instrumentos do Cliente
          </h3>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
            Pesquisas e formulários atribuídos a checkpoints específicos
          </p>
        </div>
      </div>

      {/* Seletor de cliente — mesmo padrão da Devolutiva Comportamental */}
      <div className="relative w-full max-w-md">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 block mb-2">
          Selecionar Cliente
        </label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[var(--input-bg)] hover:bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl py-4 px-6 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] transition-all outline-none"
          >
            <div className="flex items-center gap-3">
              <UserCheck size={16} className="text-[var(--accent-start)]" />
              <span>
                {selectedUser
                  ? `${selectedUser.name} (${selectedUser.matricula})`
                  : "Escolha um cliente..."}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-[var(--text-muted)] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 w-full mt-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl max-h-[300px] flex flex-col"
              >
                <div className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3 bg-[var(--input-bg)]/20">
                  <Search size={14} className="text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, matricula ou @"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {loadingUsers ? (
                    <div className="py-8 flex justify-center items-center gap-2 text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                      <Loader2 size={14} className="animate-spin text-[var(--accent-start)]" /> Carregando base de dados...
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <button
                        key={u.matricula}
                        onClick={() => {
                          setSelectedMatricula(u.matricula);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                          setOpenStageId("");
                          setFeedback(null);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-0.5 ${u.matricula === selectedMatricula ? "bg-[var(--accent-soft)] text-[var(--accent-start)]" : "hover:bg-[var(--input-bg)]/40 text-[var(--text-primary)]"}`}
                      >
                        <span className="text-xs font-black">{u.name}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono">
                          {u.nickname ? `@${u.nickname}` : u.matricula} • {u.email}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                      Nenhum cliente encontrado
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-5 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest ${
            feedback.kind === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {!selectedMatricula ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
          Selecione um cliente para ver e atribuir instrumentos.
        </p>
      ) : loadingJourney ? (
        <div className="py-12 flex justify-center items-center gap-2 text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
          <Loader2 size={14} className="animate-spin text-[var(--accent-start)]" /> Carregando jornada do cliente...
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-relaxed max-w-2xl">
            Atribuir um instrumento reabre a etapa e, pela regra de sequência, tranca as
            seguintes até a conclusão. Se o cliente já respondeu o mesmo instrumento em
            outro ponto da jornada, ele entra já concluído.
          </p>

          {journey.map((stage) => (
            <div
              key={stage.stageId}
              className="p-5 bg-[var(--input-bg)]/30 border border-[var(--border-primary)] rounded-[2rem] space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Etapa {stage.order}
                  </span>
                  <span className="text-[11px] font-black text-[var(--text-primary)] mt-0.5">{stage.title}</span>
                </div>
                <button
                  onClick={() => openAssignForm(stage.stageId)}
                  disabled={stage.checkpoints.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-start)] hover:bg-[var(--accent-end)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title={stage.checkpoints.length === 0 ? "Etapa sem checkpoints configurados" : undefined}
                >
                  <Plus size={12} />
                  {openStageId === stage.stageId ? "Cancelar" : "Atribuir"}
                </button>
              </div>

              {stage.instruments.length > 0 && (
                <div className="space-y-1.5">
                  {stage.instruments.map((instrument) => (
                    <div
                      key={instrument.id}
                      className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/40 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 ${
                            instrument.completed
                              ? "bg-green-500/15 border-green-500 text-green-400"
                              : "border-[var(--border-primary)] text-[var(--text-muted)] opacity-40"
                          }`}
                        >
                          {instrument.completed && <Check size={8} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-[var(--text-primary)] truncate">
                            {instrument.title}
                          </span>
                          <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono truncate">
                            {instrument.type === "survey" ? "Survey" : "Formulário"} • {instrument.referenceId} • parada {instrument.order}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(stage.stageId, instrument.id, instrument.title)}
                        disabled={removingId === instrument.id}
                        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 shrink-0"
                        title="Remover instrumento"
                      >
                        {removingId === instrument.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {openStageId === stage.stageId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/40 rounded-2xl space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Checkpoint
                        </label>
                        <select
                          value={parentCheckpointId}
                          onChange={(e) => setParentCheckpointId(e.target.value)}
                          className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-primary)] focus:outline-none"
                        >
                          <option value="">Selecione o checkpoint...</option>
                          {stage.checkpoints.map((checkpoint) => (
                            <option key={checkpoint.id} value={checkpoint.id}>
                              {checkpoint.order ? `${checkpoint.order}. ` : ""}
                              {checkpoint.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Instrumento
                        </label>
                        <select
                          value={instrumentRef}
                          onChange={(e) => {
                            setInstrumentRef(e.target.value);
                            setCustomTitle("");
                          }}
                          className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-primary)] focus:outline-none"
                        >
                          <option value="">Selecione o instrumento...</option>
                          {INSTRUMENTS.map((instrument) => (
                            <option
                              key={`${instrument.type}-${instrument.referenceId}`}
                              value={instrument.referenceId}
                            >
                              {instrument.type === "survey" ? "Survey" : "Formulário"} — {instrument.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Título exibido ao cliente (opcional)
                        </label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder={findInstrument(instrumentRef)?.title || "Usa o título do instrumento"}
                          className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-50 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={() => handleAssign(stage.stageId)}
                        disabled={!parentCheckpointId || !instrumentRef || saving}
                        className="w-full py-2.5 bg-[var(--accent-start)] hover:bg-[var(--accent-end)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {saving ? "Atribuindo..." : "Atribuir à jornada do cliente"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {journey.length === 0 && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
              Nenhuma etapa de jornada configurada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
