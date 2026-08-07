"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Palette, QrCode, User, Phone, Mail, Linkedin, Globe, Check } from "lucide-react";
import { BusinessCardEngine } from "@/components/ui/BusinessCardEngine";
import type { SurveyValue } from "@/types/survey";

export interface BusinessCardData {
  skipCard?: boolean;
  name?: string;
  pitch?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  visibleFields?: {
    name: boolean;
    phone: boolean;
    email: boolean;
    linkedin: boolean;
    website: boolean;
  };
  theme?: "light" | "dark" | "blue" | "grey" | "green";
  qrTarget?: "whatsapp" | "linkedin" | "website";
}

interface CvBusinessCardGeneratorProps {
  value: BusinessCardData | null | undefined;
  masterCvData: Record<string, SurveyValue> | null | undefined;
  onChange: (val: BusinessCardData) => void;
}

const VISIBILIDADE_PADRAO = {
  name: true,
  phone: true,
  email: true,
  linkedin: true,
  website: true
};

/** Monta o cartao a partir do curriculo mestre. */
const montarCartaoDoMestre = (
  masterCvData: Record<string, SurveyValue> | null | undefined
): BusinessCardData => {
  if (!masterCvData) return {};

  return {
    name: String(masterCvData.nome_completo || ""),
    phone: String(masterCvData.telefone || ""),
    email: String(masterCvData.email_profissional || ""),
    linkedin: String(masterCvData.linkedin || ""),
    website: String(masterCvData.portfolio || "")
  };
};

export function CvBusinessCardGenerator({ value, masterCvData, onChange }: CvBusinessCardGeneratorProps) {
  // `rascunho` guarda so o que o usuario alterou nesta sessao. O restante e'
  // DERIVADO das props, com precedencia: rascunho > resposta salva > curriculo
  // mestre. Derivar em vez de copiar dentro de um efeito garante que o cartao
  // apareca preenchido assim que `masterCvData` chegar, sem segunda passada.
  const [rascunho, setRascunho] = useState<BusinessCardData | null>(null);

  const form: BusinessCardData = {
    ...montarCartaoDoMestre(masterCvData),
    ...(value ?? {}),
    ...(rascunho ?? {})
  };

  // Os nomes abaixo sao mantidos identicos aos do estado anterior de proposito:
  // todo o JSX e os manipuladores continuam funcionando sem alteracao.
  const skipCard = form.skipCard ?? false;
  const name = form.name ?? "";
  const pitch = form.pitch ?? "";
  const phone = form.phone ?? "";
  const email = form.email ?? "";
  const linkedin = form.linkedin ?? "";
  const website = form.website ?? "";
  const visibleFields = form.visibleFields ?? VISIBILIDADE_PADRAO;
  const theme = form.theme ?? "light";
  const qrTarget = form.qrTarget ?? "linkedin";

  const setSkipCard = (v: boolean) => setRascunho({ ...form, skipCard: v });
  const setName = (v: string) => setRascunho({ ...form, name: v });
  const setPitch = (v: string) => setRascunho({ ...form, pitch: v });
  const setPhone = (v: string) => setRascunho({ ...form, phone: v });
  const setEmail = (v: string) => setRascunho({ ...form, email: v });
  const setLinkedin = (v: string) => setRascunho({ ...form, linkedin: v });
  const setWebsite = (v: string) => setRascunho({ ...form, website: v });
  const setVisibleFields = (v: typeof VISIBILIDADE_PADRAO) =>
    setRascunho({ ...form, visibleFields: v });
  const setTheme = (v: NonNullable<BusinessCardData["theme"]>) =>
    setRascunho({ ...form, theme: v });
  const setQrTarget = (v: NonNullable<BusinessCardData["qrTarget"]>) =>
    setRascunho({ ...form, qrTarget: v });

  // Nao ha efeito de sincronizacao aqui. O comportamento anterior nao propagava
  // o preenchimento do curriculo mestre para o motor de formularios — so exibia,
  // e a gravacao acontecia quando o usuario mexia em algo. A derivacao acima
  // reproduz exatamente isso, sem precisar de efeito.

  // Propaga mudancas de volta para o SurveyEngine
  const triggerChange = (updates: Partial<BusinessCardData>) => {
    const nextVal = {
      skipCard,
      name,
      pitch,
      phone,
      email,
      linkedin,
      website,
      visibleFields,
      theme,
      qrTarget,
      ...updates
    };
    onChange(nextVal);
  };

  const toggleFieldVisibility = (field: keyof typeof visibleFields) => {
    const nextVis = { ...visibleFields, [field]: !visibleFields[field] };
    setVisibleFields(nextVis);
    triggerChange({ visibleFields: nextVis });
  };

  const handleSkipToggle = () => {
    const nextSkip = !skipCard;
    setSkipCard(nextSkip);
    triggerChange({ skipCard: nextSkip });
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Botao de Pular Gerador */}
      <div className="flex items-center gap-3 p-4 bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={handleSkipToggle}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
            skipCard 
              ? "bg-red-500 border-red-500 text-white" 
              : "border-[var(--input-border)] hover:border-[var(--accent-start)] text-transparent"
          }`}
        >
          {skipCard && <Check size={12} strokeWidth={3} />}
        </button>
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          Nao quero gerar cartao de visita
        </span>
      </div>

      {!skipCard && (
        <div className="space-y-6">
          {/* Formulario de Edicao */}
          <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md space-y-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] block mb-1">
              Personalize os Dados do seu Cartao
            </span>

            {/* Input Nome */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                <User size={10} /> Nome Completo
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    triggerChange({ name: e.target.value });
                  }}
                  placeholder="Nome Completo..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/40 border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                />
                <button
                  type="button"
                  onClick={() => toggleFieldVisibility("name")}
                  className={`p-3 rounded-xl border transition-all ${
                    visibleFields.name
                      ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/30 text-[var(--accent-start)]"
                      : "bg-white/40 border-[var(--input-border)] text-[var(--text-muted)]"
                  }`}
                  title={visibleFields.name ? "Ocultar Nome" : "Exibir Nome"}
                >
                  {visibleFields.name ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Input Pitch Curto */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                Pitch Curto (Limite de 100 caracteres)
              </label>
              <input
                type="text"
                maxLength={100}
                value={pitch}
                onChange={(e) => {
                  setPitch(e.target.value);
                  triggerChange({ pitch: e.target.value });
                }}
                placeholder="Ex: Profissional de Logística focado em otimização de cadeias..."
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
              />
              <span className="text-[9px] text-right text-[var(--text-muted)] pr-1">
                {pitch.length}/100
              </span>
            </div>

            {/* Grid de Contatos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telefone */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                  <Phone size={10} /> Telefone (WhatsApp)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      triggerChange({ phone: e.target.value });
                    }}
                    placeholder="DDD + Numero..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/40 border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFieldVisibility("phone")}
                    className={`p-3 rounded-xl border transition-all ${
                      visibleFields.phone
                        ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/30 text-[var(--accent-start)]"
                        : "bg-white/40 border-[var(--input-border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {visibleFields.phone ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                  <Mail size={10} /> E-mail
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      triggerChange({ email: e.target.value });
                    }}
                    placeholder="E-mail..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/40 border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFieldVisibility("email")}
                    className={`p-3 rounded-xl border transition-all ${
                      visibleFields.email
                        ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/30 text-[var(--accent-start)]"
                        : "bg-white/40 border-[var(--input-border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {visibleFields.email ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                  <Linkedin size={10} /> LinkedIn
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => {
                      setLinkedin(e.target.value);
                      triggerChange({ linkedin: e.target.value });
                    }}
                    placeholder="URL LinkedIn..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/40 border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFieldVisibility("linkedin")}
                    className={`p-3 rounded-xl border transition-all ${
                      visibleFields.linkedin
                        ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/30 text-[var(--accent-start)]"
                        : "bg-white/40 border-[var(--input-border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {visibleFields.linkedin ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              {/* Website */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                  <Globe size={10} /> Portfolio / Github / Website
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      triggerChange({ website: e.target.value });
                    }}
                    placeholder="URL Website..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/40 border border-[var(--input-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-start)]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFieldVisibility("website")}
                    className={`p-3 rounded-xl border transition-all ${
                      visibleFields.website
                        ? "bg-[var(--accent-soft)] border-[var(--accent-start)]/30 text-[var(--accent-start)]"
                        : "bg-white/40 border-[var(--input-border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {visibleFields.website ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Customizacao Visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-primary)]/30">
              {/* Seletor de Tema */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                  <Palette size={10} /> Tema de Cores do Cartao
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["light", "dark", "blue", "grey", "green"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTheme(t);
                        triggerChange({ theme: t });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all active:scale-95 ${
                        theme === t
                          ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white"
                          : "bg-white/40 border-[var(--input-border)] text-[var(--text-primary)] hover:bg-white/60"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destino do QR Code */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                  <QrCode size={10} /> Destino do QR Code
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["whatsapp", "linkedin", "website"] as const).map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => {
                        setQrTarget(target);
                        triggerChange({ qrTarget: target });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all active:scale-95 ${
                        qrTarget === target
                          ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white"
                          : "bg-white/40 border-[var(--input-border)] text-[var(--text-primary)] hover:bg-white/60"
                      }`}
                    >
                      {target === "website" ? "Portfolio" : target}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Visualizacao e Acoes */}
          <div className="bg-white/40 border border-[var(--border-primary)]/40 rounded-3xl p-6 shadow-sm">
            <BusinessCardEngine
              name={name}
              pitch={pitch}
              phone={phone}
              email={email}
              linkedin={linkedin}
              website={website}
              visibleFields={visibleFields}
              theme={theme}
              qrTarget={qrTarget}
            />
          </div>
        </div>
      )}
    </div>
  );
}
