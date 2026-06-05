"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, AlertTriangle, AlertOctagon } from "lucide-react";

interface TriadVennChartProps {
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

/**
 * BPlen HUB — Triad of Time Venn Diagram (🧬📊)
 * Premium, interactive glassmorphic Venn diagram replacing the old donut chart.
 * Uses high-quality SVG circles with blend-mode, gradients, animations, and dynamic diagnostic feedback.
 */
export function TriadVennChart({ data, title, subtitle, mini = false }: TriadVennChartProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Fallback default colors in case parent data doesn't override them:
  // Green (Important), Yellow (Urgent), Red (Circumstance)
  const getCategoryTheme = (label: string) => {
    const norm = label.toLowerCase();
    if (norm.includes("importan")) {
      return {
        color: "#10b981", // Emerald Green
        gradientId: "green-grad",
        glowColor: "rgba(16, 185, 129, 0.4)",
        lightGlow: "rgba(16, 185, 129, 0.15)",
        strokeColor: "#34d399",
      };
    } else if (norm.includes("urgen")) {
      return {
        color: "#facc15", // Amber Yellow
        gradientId: "yellow-grad",
        glowColor: "rgba(250, 204, 21, 0.4)",
        lightGlow: "rgba(250, 204, 21, 0.15)",
        strokeColor: "#fde047",
      };
    } else {
      return {
        color: "#ef4444", // Crimson Red
        gradientId: "red-grad",
        glowColor: "rgba(239, 68, 68, 0.4)",
        lightGlow: "rgba(239, 68, 68, 0.15)",
        strokeColor: "#f87171",
      };
    }
  };

  // Find the category with highest percentage for dynamic diagnostic
  const getDiagnostic = () => {
    if (!data || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => b.percentage - a.percentage);
    const top = sorted[0];
    const labelNorm = top.label.toLowerCase();

    if (labelNorm.includes("importan")) {
      return {
        type: "important",
        label: "Importante",
        percentage: top.percentage,
        color: "#10b981",
        bgLight: "rgba(16, 185, 129, 0.1)",
        border: "rgba(16, 185, 129, 0.2)",
        icon: ThumbsUp,
        title: "Alta Performance",
        description: "Você está focando no que realmente gera valor e impacto duradouro para sua carreira.",
      };
    } else if (labelNorm.includes("urgen")) {
      return {
        type: "urgent",
        label: "Urgente",
        percentage: top.percentage,
        color: "#facc15",
        bgLight: "rgba(250, 204, 21, 0.1)",
        border: "rgba(250, 204, 21, 0.2)",
        icon: AlertTriangle,
        title: "Alerta de Estresse",
        description: "Sua rotina está sendo dominada por prazos e correrias. Atenção para evitar o esgotamento.",
      };
    } else {
      return {
        type: "circumstance",
        label: "Circunstancial",
        percentage: top.percentage,
        color: "#ef4444",
        bgLight: "rgba(239, 68, 68, 0.1)",
        border: "rgba(239, 68, 68, 0.2)",
        icon: AlertOctagon,
        title: "Atenção ao Desperdício",
        description: "Excesso de tempo em distrações ou tarefas irrelevantes. Reorganize suas prioridades.",
      };
    }
  };

  const diag = getDiagnostic();
  const DiagnosticIcon = diag?.icon;

  // Venn Circle Positions (Equilateral arrangement in 240x220 viewBox)
  const circles = [
    {
      id: "important",
      label: "Importante",
      keyPart: "importan",
      cx: 120,
      cy: 85,
      r: 58,
    },
    {
      id: "urgent",
      label: "Urgente",
      keyPart: "urgen",
      cx: 88,
      cy: 140,
      r: 58,
    },
    {
      id: "circumstance",
      label: "Circunstancial",
      keyPart: "circun",
      cx: 152,
      cy: 140,
      r: 58,
    },
  ];

  // Helper to match a data item with circle config
  const getDataItemForCircle = (keyPart: string) => {
    return data.find((item) => item.label.toLowerCase().includes(keyPart)) || { label: "", percentage: 0 };
  };

  // Mini Venn Circle Positions (Equilateral arrangement in 420x310 viewBox for perfect side/top labels)
  const miniCircles = [
    {
      id: "important",
      label: "Importante",
      keyPart: "importan",
      cx: 210,
      cy: 115,
      r: 90,
    },
    {
      id: "urgent",
      label: "Urgente",
      keyPart: "urgen",
      cx: 162,
      cy: 195,
      r: 90,
    },
    {
      id: "circumstance",
      label: "Circunstancial",
      keyPart: "circun",
      cx: 258,
      cy: 195,
      r: 90,
    },
  ];

  if (mini) {
    // Mini Venn Render (used for grids or compact cards)
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full group/venn">
        <svg
          viewBox="0 0 420 310"
          className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="mini-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="mini-yellow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="mini-red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Render Circles with blend overlay */}
          <g style={{ mixBlendMode: "screen" }}>
            {miniCircles.map((c) => {
              const theme = getCategoryTheme(c.label);
              return (
                <circle
                  key={c.id}
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill={`url(#mini-${theme.gradientId})`}
                  fillOpacity="0.32"
                  stroke={theme.strokeColor}
                  strokeWidth="1.5"
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Symmetrical, beautiful labels next to each circle */}
          <text
            x={210}
            y={18}
            textAnchor="middle"
            className="font-black uppercase tracking-[0.1em] text-[10px] select-none"
            fill="#10b981"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          >
            Importante {Math.round(getDataItemForCircle("importan").percentage)}%
          </text>

          <text
            x={58}
            y={199}
            textAnchor="end"
            className="font-black uppercase tracking-[0.1em] text-[10px] select-none"
            fill="#facc15"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          >
            Urgente {Math.round(getDataItemForCircle("urgen").percentage)}%
          </text>

          <text
            x={362}
            y={199}
            textAnchor="start"
            className="font-black uppercase tracking-[0.1em] text-[10px] select-none"
            fill="#ef4444"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          >
            Circunstancial {Math.round(getDataItemForCircle("circun").percentage)}%
          </text>
        </svg>

        {/* Floating Mini Center Badge representing Diagnostic Winner */}
        {diag && (
          <div 
            className="absolute p-1 rounded-full border shadow-lg backdrop-blur-md animate-pulse"
            style={{ 
              backgroundColor: diag.bgLight, 
              borderColor: diag.border,
              color: diag.color
            }}
          >
            {DiagnosticIcon && <DiagnosticIcon size={12} strokeWidth={2.5} />}
          </div>
        )}
      </div>
    );
  }

  // Large Interactive Premium Render
  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-10 py-4">
      
      {/* Venn Diagram Container */}
      <div className="relative flex items-center justify-center p-4 bg-white/[0.01] border border-white/5 rounded-[2.5rem] backdrop-blur-sm shadow-2xl">
        <svg
          viewBox="0 0 240 220"
          className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 overflow-visible"
        >
          <defs>
            {/* Shadow Filters for Premium Glow */}
            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* High Quality Color Gradients */}
            <linearGradient id="large-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="large-yellow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="large-red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Glassmorphic SVG Elements */}
          <g style={{ mixBlendMode: "screen" }}>
            {circles.map((c) => {
              const item = getDataItemForCircle(c.keyPart);
              const theme = getCategoryTheme(c.label);
              const isHovered = hoveredLabel === c.label;

              return (
                <g key={c.id}>
                  {/* Glowing background circle when hovered */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.circle
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 0.25, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        cx={c.cx}
                        cy={c.cy}
                        r={c.r + 4}
                        fill={theme.color}
                        filter="url(#glow-filter)"
                        pointerEvents="none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Primary interactive Venn Circle */}
                  <motion.circle
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 18 }}
                    cx={c.cx}
                    cy={c.cy}
                    r={c.r}
                    fill={`url(#large-${theme.gradientId})`}
                    fillOpacity={isHovered ? "0.45" : "0.28"}
                    stroke={theme.strokeColor}
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                    onMouseEnter={() => setHoveredLabel(c.label)}
                    onMouseLeave={() => setHoveredLabel(null)}
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      filter: isHovered 
                        ? `drop-shadow(0 0 10px ${theme.glowColor})` 
                        : `drop-shadow(0 0 3px ${theme.lightGlow})`,
                    }}
                  />

                  {/* Inner text inside circles displaying Percentages */}
                  <text
                    x={c.cx}
                    y={c.cy + 4}
                    textAnchor="middle"
                    pointerEvents="none"
                    className="font-black tracking-tight text-[11px] fill-white pointer-events-none select-none transition-all duration-300"
                    style={{
                      opacity: isHovered ? 1 : 0.85,
                      textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {Math.round(item.percentage)}%
                  </text>

                  {/* Tiny Label tag for each circle */}
                  <text
                    x={c.cx}
                    y={c.cy - 12}
                    textAnchor="middle"
                    pointerEvents="none"
                    className="font-bold uppercase tracking-[0.1em] text-[6px] fill-white/60 pointer-events-none select-none"
                  >
                    {c.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Info central text inside Venn Diagram */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {hoveredLabel ? (
              <motion.div
                key="hover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center px-6"
              >
                <span 
                  className="text-2xl font-black tracking-tight transition-colors"
                  style={{ color: getCategoryTheme(hoveredLabel).strokeColor }}
                >
                  {Math.round(getDataItemForCircle(hoveredLabel).percentage)}%
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-primary)] opacity-60">
                  {hoveredLabel}
                </span>
              </motion.div>
            ) : diag ? (
              <motion.div
                key="diag"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center px-4"
              >
                <div 
                  className="p-1.5 rounded-full border mb-1"
                  style={{ 
                    backgroundColor: diag.bgLight, 
                    borderColor: diag.border,
                    color: diag.color 
                  }}
                >
                  {DiagnosticIcon && <DiagnosticIcon size={14} strokeWidth={2.5} />}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-primary)] opacity-40">
                  Foco Atual
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Details & Dynamic Diagnostics Section */}
      <div className="flex-1 space-y-6 max-w-md w-full">
        {/* Title / Subtitle if passed */}
        {(title || subtitle) && (
          <div className="space-y-1">
            {subtitle && (
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-start)]">
                {subtitle}
              </span>
            )}
            {title && (
              <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                {title}
              </h3>
            )}
          </div>
        )}

        {/* Diagnostic Highlight Pill */}
        {diag && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-[1.5rem] border backdrop-blur-md relative overflow-hidden flex gap-4"
            style={{ 
              backgroundColor: diag.bgLight, 
              borderColor: diag.border 
            }}
          >
            <div 
              className="p-3 rounded-2xl h-fit border shadow-inner"
              style={{ 
                backgroundColor: "rgba(255,255,255,0.02)",
                borderColor: diag.border,
                color: diag.color
              }}
            >
              {DiagnosticIcon && <DiagnosticIcon size={20} strokeWidth={2.5} />}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 text-[var(--text-primary)]">
                  Diagnóstico:
                </span>
                <span 
                  className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-[9px] border bg-white/5"
                  style={{ color: diag.color, borderColor: diag.border }}
                >
                  {diag.title}
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--text-primary)] opacity-90 leading-relaxed">
                {diag.description}
              </p>
            </div>
          </motion.div>
        )}

        {/* Legend / Metrics List */}
        <div className="space-y-3.5">
          {data.map((item, idx) => {
            const theme = getCategoryTheme(item.label);
            const isHovered = hoveredLabel === item.label;

            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredLabel(item.label)}
                onMouseLeave={() => setHoveredLabel(null)}
                className={`p-3 rounded-[1.25rem] border transition-all duration-300 cursor-pointer ${
                  isHovered
                    ? "bg-white/[0.04] border-white/15 scale-[1.02]"
                    : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                }`}
                style={{
                  boxShadow: isHovered ? `0 4px 20px -5px ${theme.glowColor}` : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full border shadow-inner transition-transform duration-300"
                      style={{
                        backgroundColor: theme.color,
                        borderColor: theme.strokeColor,
                        transform: isHovered ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="text-base font-black transition-colors duration-300"
                      style={{ color: theme.strokeColor }}
                    >
                      {Math.round(item.percentage)}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-50">%</span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed pl-6 mt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
