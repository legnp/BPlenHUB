"use client";

import React, { useState } from "react";
import GlassModal from "@/components/ui/GlassModal";
import { InputGlass } from "@/components/ui/InputGlass";
import { TextareaGlass } from "@/components/ui/TextareaGlass";
import { registerFaqQuestionAction } from "@/actions/products";
import { MessageSquare, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FAQContactModalProps {
  productName: string;
  productSlug: string;
}

type Step = "choose" | "form" | "success";

export default function FAQContactModal({ productName, productSlug }: FAQContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    `Olá Lis, eu gostaria de esclarecer algumas dúvidas sobre o ${productName}.\nPoderia me ajudar?`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirecionamento oficial para o WhatsApp
  const handleWhatsAppRedirect = () => {
    const text = `Olá Lis, eu gostaria de esclarecer algumas dúvidas sobre o ${productName}.\nPoderia me ajudar?`;
    const url = `https://wa.me/5511945152088?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setIsOpen(false);
  };

  const handleOpenModal = () => {
    setStep("choose");
    setName("");
    setEmail("");
    setMessage(`Olá Lis, eu gostaria de esclarecer algumas dúvidas sobre o ${productName}.\nPoderia me ajudar?`);
    setError(null);
    setIsOpen(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await registerFaqQuestionAction({
        name,
        email,
        message,
        productName,
        productSlug
      });

      if (res.success) {
        setStep("success");
      } else {
        setError(res.error || "Ocorreu um erro ao enviar sua dúvida. Tente novamente.");
      }
    } catch (err: any) {
      setError("Erro de conexão. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center mt-12">
      {/* Botão principal estático premium */}
      <button
        onClick={handleOpenModal}
        className="px-8 py-4 rounded-3xl bg-white/5 hover:bg-[#ff0080]/15 border border-white/10 hover:border-[#ff0080]/40 text-white hover:text-white font-black uppercase text-[11px] tracking-widest transition-all duration-300 shadow-lg hover:shadow-[#ff0080]/10 flex items-center gap-3 group"
      >
        <MessageSquare size={14} className="text-gray-400 group-hover:text-[#ff0080] transition-colors" />
        Envie sua pergunta a BPlen
      </button>

      {/* Modal premium do fluxo de contato */}
      <GlassModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          step === "choose" 
            ? "Esclareça suas dúvidas" 
            : step === "form" 
              ? "Enviar Pergunta" 
              : "Dúvida Registrada"
        }
        subtitle={
          step === "choose" 
            ? "Escolha o melhor canal de atendimento" 
            : step === "form" 
              ? "Receberemos sua mensagem por e-mail" 
              : "Tudo pronto por aqui"
        }
        maxWidth="max-w-md"
      >
        {step === "choose" && (
          <div className="space-y-6 pt-4 text-left">
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Por qual canal gostaria de esclarecer suas dúvidas?
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* Botão de WhatsApp */}
              <button
                onClick={handleWhatsAppRedirect}
                className="w-full p-6 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-all duration-300 flex items-center gap-5 group"
              >
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">WhatsApp</h4>
                  <p className="text-xs text-gray-400 mt-1 font-bold">Redirecionar para o chat imediato</p>
                </div>
              </button>

              {/* Botão de E-mail */}
              <button
                onClick={() => setStep("form")}
                className="w-full p-6 rounded-2xl bg-[#ff0080]/10 hover:bg-[#ff0080]/20 border border-[#ff0080]/20 hover:border-[#ff0080]/40 text-left transition-all duration-300 flex items-center gap-5 group"
              >
                <div className="p-3 bg-[#ff0080]/20 rounded-xl text-[#ff0080] group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">E-mail</h4>
                  <p className="text-xs text-gray-400 mt-1 font-bold">Preencher formulário no modal</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5 pt-4 text-left">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            <InputGlass
              label="Nome Completo"
              required
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <InputGlass
              label="E-mail Completo"
              type="email"
              required
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <TextareaGlass
              label="Mensagem"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />

            <div className="pt-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors"
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 px-5 py-3 rounded-2xl bg-[#ff0080] hover:bg-[#ff0080]/90 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-md shadow-[#ff0080]/20 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Mensagem"
                )}
              </button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-6 pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-black text-white">Sua mensagem foi enviada!</h4>
              <p className="text-sm text-gray-300 leading-relaxed font-bold tracking-tight text-left bg-white/5 p-6 rounded-2xl border border-white/5 whitespace-pre-line">
                A equipe BPlen agradece a sua mensagem!
                {"\n"}
                Responderemos o seu e-mail em breve. Por favor, valide se você recebeu a confirmação do registro dessa dúvida na sua caixa de e-mail.
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black uppercase text-[10px] tracking-widest transition-all"
            >
              Fechar Janela
            </button>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
