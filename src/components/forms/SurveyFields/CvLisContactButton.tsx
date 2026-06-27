"use client";

import React from "react";
import { MessageSquare, Linkedin } from "lucide-react";

export function CvLisContactButton() {
  const whatsappUrl = "https://wa.me/5511945152088?text=Ola,%20Lis!%20Envio%20aqui%20o%20meu%20pitch%20e%20a%20pauta%20para%20a%20nossa%20reuniao.";
  const linkedinUrl = "https://www.linkedin.com/in/lisandralencina/";

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1 block mb-3">
          Falar com a Lis
        </span>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar Pitch pelo WhatsApp</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0077b5] hover:bg-[#006296] text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            <Linkedin className="w-4 h-4" />
            <span>Ver LinkedIn da Lis</span>
          </a>
        </div>
      </div>
    </div>
  );
}
