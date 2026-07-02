"use client";

import React from "react";
import { NarrativeReveal } from "@/components/ui/NarrativeReveal";

type NarrativeRevealVariant = "h2" | "h3" | "p" | "p-muted";

interface NarrativeContentProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

/**
 * NarrativeContent (Orquestrador de Revelação v3.2 🎭)
 * Gere a sequência de blocos narrativos usando a nova estratégia de Reveal Estável.
 */
export function NarrativeContent({ text, onComplete, speed = 25 }: NarrativeContentProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [allComplete, setAllComplete] = React.useState(false);
  const blocks = React.useMemo(() => parseNarrativeBlocks(text), [text]);

  const handleBlockComplete = (idx: number) => {
    if (idx === blocks.length - 1) {
      setAllComplete(true);
      if (onComplete) onComplete();
    } else {
      setActiveIndex(idx + 1);
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const isQueued = i > activeIndex;
        const reached = i <= activeIndex || allComplete;

        return (
          <div key={i} className={isQueued ? "opacity-0 select-none pointer-events-none" : "opacity-100"}>
             <NarrativeReveal
                text={block.content}
                variant={block.type}
                speed={speed}
                active={reached}
                onComplete={() => handleBlockComplete(i)}
             />
          </div>
        );
      })}
    </div>
  );
}

// Auxiliares de Parsing mantidos para compatibilidade gramatical 🧬

interface NarrativeBlockData {
  type: NarrativeRevealVariant;
  content: string;
}

function parseNarrativeBlocks(text: string): NarrativeBlockData[] {
  if (!text) return [];
  const paragraphs = text.split('\n\n');
  return paragraphs.map(p => {
    if (p.startsWith('###')) return { type: "h3", content: p.replace('###', '').trim() };
    if (p.includes('•') || p.toLowerCase().includes('instruções') || p.toLowerCase().includes('importante')) {
      return { type: "p-muted", content: p };
    }
    return { type: "p", content: p };
  });
}

/**
 * NarrativeBlock (Manteve-se estático para previews)
 */
export function NarrativeBlock({ text }: { text: string }) {
  if (!text) return null;
  const blocks = parseNarrativeBlocks(text);
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => (
        <NarrativeReveal key={i} text={b.content} variant={b.type} active={true} speed={0} />
      ))}
    </div>
  );
}
