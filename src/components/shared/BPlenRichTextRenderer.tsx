"use client";

import React from "react";
import Link from "next/link";

interface InlineToken {
  type: "text" | "bold" | "link" | "schedule";
  content: string;
  url?: string;
}

/**
 * parseInlineStyles
 * Tokeniza o texto de forma iterativa e segura para aplicar negritos (**text**),
 * autolinks de agendamento (agenda uma conversa) e links da web.
 */
function parseInlineStyles(text: string): React.ReactNode {
  if (!text) return null;

  const tokens: InlineToken[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);

    // 1. Detecta negritos: **texto**
    const boldMatch = remainingText.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push({
        type: "bold",
        content: boldMatch[1]
      });
      currentIndex += boldMatch[0].length;
      continue;
    }

    // 2. Detecta links de agendamento (versão expandida)
    const scheduleRegex = /^(agend[ae]r?\s+(?:uma\s+)?(?:conversa|horário|reunião|sessão|atendimento|consultoria)(?:\s+com\s+a\s+equipe\s+BPlen|\s+com\s+a\s+BPlen|\s+para\s+esclarecer\s+dúvidas?|\s+para\s+saber\s+mais|\s+para\s+consultar[^.]*)?|agendamento\s+disponível)/i;
    const scheduleMatch = remainingText.match(scheduleRegex);
    if (scheduleMatch) {
      tokens.push({
        type: "schedule",
        content: scheduleMatch[1]
      });
      currentIndex += scheduleMatch[0].length;
      continue;
    }

    // 3. Detecta hiperlinks gerais (mais robusto)
    const urlRegex = /^(https?:\/\/[^\s\)\],;!]+|www\.[^\s\)\],;!]+)/i;
    const urlMatch = remainingText.match(urlRegex);
    if (urlMatch) {
      const rawUrl = urlMatch[1];
      let cleanUrl = rawUrl;
      if (rawUrl.toLowerCase().startsWith("www.")) {
        cleanUrl = "https://" + rawUrl;
      }
      tokens.push({
        type: "link",
        content: rawUrl,
        url: cleanUrl
      });
      currentIndex += urlMatch[0].length;
      continue;
    }

    // 4. Se não houver tokens especiais, consome texto até o próximo ponto de interesse
    const nextSpecialIndex = remainingText.search(/\*\*|agend|https?:\/\/|www\./i);
    if (nextSpecialIndex === -1) {
      tokens.push({
        type: "text",
        content: remainingText
      });
      break;
    } else if (nextSpecialIndex === 0) {
      tokens.push({
        type: "text",
        content: remainingText[0]
      });
      currentIndex += 1;
    } else {
      tokens.push({
        type: "text",
        content: remainingText.substring(0, nextSpecialIndex)
      });
      currentIndex += nextSpecialIndex;
    }
  }

  return (
    <>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case "bold":
            return (
              <strong key={idx} className="text-white font-bold drop-shadow-sm">
                {token.content}
              </strong>
            );
          case "schedule":
            return (
              <Link
                key={idx}
                href="/agendar"
                className="text-[#ff0080] hover:text-[#ff0080]/80 underline underline-offset-4 decoration-[#ff0080]/30 hover:decoration-[#ff0080] transition-all font-bold"
              >
                {token.content}
              </Link>
            );
          case "link":
            return (
              <a
                key={idx}
                href={token.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00f2fe] hover:text-[#00f2fe]/80 underline underline-offset-4 decoration-[#00f2fe]/30 hover:decoration-[#00f2fe] transition-all font-medium inline-flex items-center gap-1 break-all"
              >
                {token.content}
              </a>
            );
          default:
            return token.content;
        }
      })}
    </>
  );
}

interface BPlenRichTextRendererProps {
  text: string;
  className?: string;
  variant?: "default" | "large" | "small";
}

/**
 * BPlenRichTextRenderer — Componente de Renderização Dinâmica 🧬
 * Estrutura e harmoniza textos ricos preservando quebras de linha,
 * classificando subtítulos (linhas terminadas em ':') e agrupando listas.
 */
export function BPlenRichTextRenderer({ 
  text, 
  className = "", 
  variant = "default" 
}: BPlenRichTextRendererProps) {
  if (!text) return null;

  const isLarge = variant === "large";
  const isSmall = variant === "small";
  const lines = text.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`${keyPrefix}-list`} className="space-y-3 my-5 pl-1 list-none">
          {currentListItems.map((item, itemIdx) => {
            let itemClass = "text-sm md:text-base font-normal text-gray-300";
            let bulletClass = "mt-2 w-1.5 h-1.5";
            if (isLarge) {
              itemClass = "text-base md:text-lg font-medium text-gray-200";
              bulletClass = "mt-2.5 w-2 h-2";
            } else if (isSmall) {
              itemClass = "text-xs md:text-sm font-normal text-gray-400";
              bulletClass = "mt-1.5 w-1.2 h-1.2";
            }

            return (
              <li 
                key={itemIdx} 
                className={`flex items-start gap-3 leading-relaxed tracking-tight opacity-90 transition-all group/item ${itemClass}`}
              >
                {/* Indicador customizado premium com brilho (neon pink) */}
                <span className={`rounded-full bg-[#ff0080] shrink-0 shadow-[0_0_8px_rgba(255,0,128,0.7)] group-hover/item:scale-125 transition-transform ${bulletClass}`} />
                <span className="flex-1">{parseInlineStyles(item)}</span>
              </li>
            );
          })}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      // Linha vazia: descarrega qualquer lista acumulada
      flushList(`spacer-${idx}`);
      return;
    }

    // Detecta se a linha é um item de lista (inicia com •, -, ou *)
    const bulletMatch = trimmedLine.match(/^[•\-\*]\s*(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();
      if (content) {
        currentListItems.push(content);
      }
    } else {
      // Não é item de lista: descarrega listas acumuladas primeiro
      flushList(`nonlist-${idx}`);

      // Verifica se é um subtítulo (termina com dois pontos e comprimento razoável)
      const isSubtitle = trimmedLine.endsWith(":") && trimmedLine.length < 120;
      if (isSubtitle) {
        let subClass = "text-xs md:text-sm tracking-[0.15em] text-[#ff0080]/90 mt-8 mb-3";
        if (isLarge) {
          subClass = "text-sm md:text-base tracking-[0.18em] text-[#ff0080] mt-10 mb-4";
        } else if (isSmall) {
          subClass = "text-[10px] md:text-xs tracking-[0.12em] text-[#ff0080]/90 mt-6 mb-2";
        }

        renderedElements.push(
          <h4 
            key={`sub-${idx}`} 
            className={`font-black uppercase block ${subClass}`}
          >
            {parseInlineStyles(trimmedLine)}
          </h4>
        );
      } else {
        // Parágrafo padrão
        let pClass = "text-sm md:text-base font-normal text-gray-300";
        if (isLarge) {
          pClass = "text-lg md:text-xl font-medium text-gray-200";
        } else if (isSmall) {
          pClass = "text-xs md:text-sm font-normal text-gray-400";
        }

        renderedElements.push(
          <p 
            key={`p-${idx}`} 
            className={`leading-relaxed tracking-tight opacity-90 mb-4 ${pClass}`}
          >
            {parseInlineStyles(trimmedLine)}
          </p>
        );
      }
    }
  });

  // Garante que qualquer lista residual seja renderizada no final do texto
  flushList("final");

  return <div className={`space-y-4 ${className}`}>{renderedElements}</div>;
}
