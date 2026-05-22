"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface StepContainerProps {
  children: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

/**
 * BPlen HUB — StepContainer 🧬🛡️
 * The premium glassmorphic wrapper for the current journey step.
 * Description section is collapsible (closed by default).
 */
export function StepContainer({ children, title, description, badge }: StepContainerProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full max-w-7xl mx-auto flex flex-col gap-6"
    >


      {/* Main Glass Workspace */}
      <div id="checkpoints-area" className="flex-1 p-8 rounded-[3.5rem] bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-2xl relative overflow-hidden">
         {/* Subtle Workspace Border Glow */}
         <div className="absolute inset-0 border-[var(--accent-start)]/5 border rounded-[3.5rem] pointer-events-none" />
          
         <div className="flex h-full gap-8 relative z-10">
            {children}
         </div>
      </div>
    </motion.div>
  );
}

