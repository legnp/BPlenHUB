"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TriadDonutChartProps {
  data: {
    label: string;
    percentage: number;
    color: string;
    description?: string;
  }[];
  title?: string;
  subtitle?: string;
  mini?: boolean;
}

export function TriadDonutChart({ data, title, subtitle, mini = false }: TriadDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const size = mini ? 160 : 250;
  const center = size / 2;
  const radius = mini ? 60 : 90;
  const strokeWidth = mini ? 12 : 20;
  const circumference = 2 * Math.PI * radius;

  const totalPercentage = Math.round(data.reduce((acc, curr) => acc + curr.percentage, 0));

  // Find predominant element (highest score) to show its initial (V, A, C, D)
  const predominant = data && data.length > 0 
    ? [...data].sort((a, b) => b.percentage - a.percentage)[0] 
    : null;
  const predominantLetter = predominant ? predominant.label.charAt(0).toUpperCase() : "";
  const predominantColor = predominant ? predominant.color : "var(--text-primary)";

  return (
    <div className={`w-full flex flex-col ${mini ? 'items-center' : 'md:flex-row items-center justify-center'} gap-8`}>
      <div className="relative group/chart">
        <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
          {/* Fundo do Donut */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="transparent" 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth={strokeWidth} 
          />

          {data.map((item, index) => {
            let offset = 0;
            for (let i = 0; i < index; i++) {
              offset += (data[i].percentage / 100) * circumference;
            }

            const isHovered = hoveredIndex === index;

            return (
              <motion.circle
                key={item.label}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ 
                  strokeDasharray: `${(item.percentage / 100) * circumference} ${circumference}`,
                  strokeWidth: isHovered ? strokeWidth + 4 : strokeWidth,
                }}
                transition={{ 
                  strokeDasharray: { duration: 1.5, delay: index * 0.2, ease: "circOut" },
                  strokeWidth: { duration: 0.2 }
                }}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-300"
                style={{ 
                   filter: isHovered 
                    ? `drop-shadow(0 0 8px ${item.color}60)` 
                    : `drop-shadow(0 0 4px ${item.color}30)`,
                   zIndex: isHovered ? 10 : 1
                }}
              />
            );
          })}
        </svg>

        {/* Info Central Dinâmica (🧬 Interativa) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <AnimatePresence mode="wait">
             {hoveredIndex !== null ? (
               <motion.div
                 key="hovered"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className="flex flex-col items-center"
               >
                 <span 
                    className={`font-black tracking-tighter transition-colors ${mini ? 'text-xl' : 'text-4xl'}`}
                    style={{ color: data[hoveredIndex].color }}
                 >
                    {Math.round(data[hoveredIndex].percentage)}%
                 </span>
                 <span className={`font-black uppercase tracking-[0.2em] text-[var(--text-primary)] opacity-80 ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
                    {data[hoveredIndex].label}
                 </span>
               </motion.div>
             ) : (
               <motion.div
                 key="predominant"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="flex flex-col items-center justify-center text-center"
               >
                 <span 
                    className={`font-black tracking-tight ${mini ? 'text-2xl md:text-3xl' : 'text-5xl md:text-6xl'}`}
                    style={{ color: predominantColor }}
                 >
                    {predominantLetter}
                 </span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {!mini && (
        <div className="flex-1 space-y-6 max-w-sm">
          {data.map((item) => (
            <div key={item.label} className="group space-y-1.5 p-3 rounded-2xl hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
                </div>
                <span className="text-sm font-black text-[var(--accent-start)]">{item.percentage}%</span>
              </div>
              {item.description && (
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed pl-6 opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
