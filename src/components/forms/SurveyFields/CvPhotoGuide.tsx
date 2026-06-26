"use client";

import React from "react";
import Image from "next/image";

export function CvPhotoGuide() {
  const images = [
    { src: "/images/profile_example_1.jpg", label: "Fundo neutro, boa iluminacao e expressao natural" },
    { src: "/images/profile_example_2.jpg", label: "Roupas corporativas condizentes com seu mercado target" },
    { src: "/images/profile_example_3.jpg", label: "Enquadramento focado no rosto (cerca de 75%)" },
    { src: "/images/profile_example_4.jpg", label: "Contraste harmonioso e visual nitido" }
  ];

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1 block mb-4">
          Exemplos de Inspiracao para Foto de Perfil
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-[var(--accent-start)]/50 transition-all duration-300"
            >
              <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden">
                <Image
                  src={img.src}
                  alt={`Exemplo de foto de perfil ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-[var(--text-muted)] leading-normal text-center min-h-[30px] flex items-center justify-center">
                  {img.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
