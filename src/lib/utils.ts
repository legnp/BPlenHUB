import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { format, parseISO } from "date-fns";

/**
 * Utilitário para mesclagem de classes Tailwind com suporte a condicionais.
 * Resolve conflitos de prioridade de forma inteligente.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforma uma string em um slug seguro para sistemas de arquivos e URLs.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');
}

/**
 * Gera o identificador padrão BPlen para um evento: {Titulo}_{AAMMDD}_{ID}
 */
export function getEventStandardSlug(summary: string, dateIso: string, eventId: string): string {
  try {
    const date = parseISO(dateIso);
    const dateStr = format(date, "yyMMdd");
    const cleanTitle = slugify(summary || "Evento_Sem_Titulo");
    
    // Pegamos apenas os primeiros 6 caracteres do ID se for muito longo, ou ele todo se for curto.
    // Mas para garantir unicidade total em "rotas", o ID completo é melhor.
    return `${cleanTitle}_${dateStr}_${eventId}`;
  } catch (err) {
    return `${slugify(summary || "evento")}_${eventId}`;
  }
}

/**
 * Normaliza uma string de forma resiliente para comparacao de chaves.
 * Remove acentos, pontuacoes, substitui underlines/hifens por espacos,
 * remove stop words comuns e espacos extras.
 */
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\b(de|em|e|para|da|do|dos|das)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

