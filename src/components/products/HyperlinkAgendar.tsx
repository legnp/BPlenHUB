import React from "react";
import Link from "next/link";

interface HyperlinkAgendarProps {
  text: string;
}

/**
 * HyperlinkAgendar (Componente Utilitário 🔗)
 * Detecta automaticamente variações de "agende/agenda/agendar uma conversa"
 * e as transforma em um Link Next.js estilizado premium direcionado para /agendar.
 */
export function HyperlinkAgendar({ text }: HyperlinkAgendarProps) {
  if (!text) return null;

  // Regex de captura para fatiar o texto mantendo as correspondências
  const regex = /(agend[ae]r?\s+uma\s+conversa(?:\s+com\s+a\s+equipe\s+BPlen|\s+com\s+a\s+BPlen|\s+para\s+esclarecer\s+dúvidas?|\s+para\s+saber\s+mais|\s+para\s+consultar[^.]*)?)/gi;
  
  // Regex simples (sem flag global) para testar individualmente cada pedaço fatiado
  const testRegex = /agend[ae]r?\s+uma\s+conversa/i;

  const parts = text.split(regex);
  if (parts.length === 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, idx) => {
        if (testRegex.test(part)) {
          return (
            <Link
              key={idx}
              href="/agendar"
              className="text-[#ff0080] hover:text-[#ff0080]/80 underline underline-offset-4 decoration-[#ff0080]/30 hover:decoration-[#ff0080] transition-all font-bold"
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
    </>
  );
}
