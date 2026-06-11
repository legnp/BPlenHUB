"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
  { text: "Torna-te aquilo que és.", author: "Friedrich Nietzsche" },
  { text: "Só sei que nada sei.", author: "Sócrates" },
  { text: "Aprender é mudar de postura.", author: "Sócrates" },
  { text: "O aprendizado começa com o espanto.", author: "Aristóteles" },
  { text: "Penso, logo existo.", author: "René Descartes" },
  { text: "A leitura fornece conhecimento; a mente absorve.", author: "John Locke" },
  { text: "Quem tem um 'porquê' enfrenta qualquer 'como'.", author: "Friedrich Nietzsche" },
  { text: "O preconceito é a opinião sem conhecimento.", author: "Voltaire" },
  { text: "O homem nasceu livre, e em toda parte se encontra sob ferros.", author: "Jean-Jacques Rousseau" },
  { text: "Tornas-te eternamente responsável por aquilo que cativas.", author: "Antoine de Saint-Exupéry" },
  { text: "Aqueles que não conseguem lembrar o passado estão condenados a repeti-lo.", author: "George Santayana" },
  { text: "Se vi mais longe, foi por estar sobre os ombros de gigantes.", author: "Isaac Newton" },
  { text: "Nenhum homem vivo pode escapar do sofrimento.", author: "Odisseia de Homero" }
];

export function DynamicSubtitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % QUOTES.length);
    }, 6000); // Muda a cada 6 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-16 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="text-center"
        >
          <p className="text-gray-400 italic text-lg lg:text-xl font-light tracking-wide px-4">
            "{QUOTES[index].text}"
          </p>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-medium">
            {QUOTES[index].author}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
