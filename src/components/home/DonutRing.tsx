"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface DonutRingProps {
  value: number;
  color: string;
  suffix: string;
  delay?: number;
}

export function DonutRing({
  value,
  color,
  suffix,
  delay = 0,
}: DonutRingProps) {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const radius = 58;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = isInView ? (value / 100) * circumference : 0;

  // Animated counter logic
  useEffect(() => {
    if (!isInView) return;
    const duration = 1800; // ms
    const startTime = Date.now() + delay * 1000;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) return;
      const ratio = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - ratio, 3);
      setCount(Math.round(eased * value));
      if (ratio >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, value, delay]);

  return (
    <div ref={containerRef} className="relative w-[140px] h-[140px] flex-shrink-0">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: isInView
              ? circumference - progress
              : circumference,
          }}
          transition={{
            duration: 1.8,
            delay: delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-3xl font-black tracking-tight"
          style={{ color }}
        >
          {count}
          <span className="text-lg">{suffix}</span>
        </span>
      </div>
    </div>
  );
}
