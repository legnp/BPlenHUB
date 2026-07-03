"use client";

import React from "react";
import { motion } from "framer-motion";

const socials = [
  {
    name: "LinkedIn",
    icon: (
      <img src="/linkedin.webp" alt="LinkedIn" className="w-5 h-5 object-contain" />
    ),
    url: "https://www.linkedin.com/in/lisandralencina/",
    appUrl: "linkedin://profile/lisandralencina",
    color: "#0077B5",
  },
  {
    name: "Instagram",
    icon: (
      <img src="/insta.png" alt="Instagram" className="w-5 h-5 object-contain" />
    ),
    url: "https://www.instagram.com/lis_lencina",
    appUrl: "instagram://user?username=lis_lencina",
    color: "#E1306C",
  },
  {
    name: "WhatsApp",
    icon: (
      <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
    ),
    url: "https://wa.me/5511945152088",
    appUrl: "whatsapp://send?phone=5511945152088",
    color: "#25D366",
  },
  {
    name: "TikTok",
    icon: (
      <img src="/tiktok.png" alt="TikTok" className="w-5 h-5 object-contain" />
    ),
    url: "https://www.tiktok.com/@lis.lencina",
    appUrl: "tiktok://user?screen_name=lis.lencina",
    color: "#00f2ea",
  },
];

/**
 * SocialSidebar — Barra de redes sociais vertical (Ghost Left Sidebar)
 * Design minimalista com Glassmorphism e interação premium.
 */
export function SocialSidebar() {
  const handleSocialClick = (url: string, appUrl: string) => {
    // Tenta abrir o App
    // eslint-disable-next-line react-hooks/purity
    const start = Date.now();
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = appUrl;

    // Fallback: Se em 500ms não mudar de página (app não abriu), abre o navegador
    setTimeout(() => {
       
      if (Date.now() - start < 1000) {
        window.open(url, "_blank");
      }
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 1.5 }}
      className="fixed bottom-6 left-6 md:top-1/2 md:left-8 md:-translate-y-1/2 md:bottom-auto hidden md:flex flex-col items-center gap-6 md:gap-8 z-chrome"
    >
      {/* Rótulo Vertical Sutil - Escondido no Mobile para ganhar espaço */}
      <div className="flex-col items-center gap-4 hidden md:flex">
        <span 
          className="text-[10px] text-gray-500 font-medium tracking-[0.3em] uppercase [writing-mode:vertical-lr] rotate-180 mb-2"
        >
          Conecte-se
        </span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[var(--border-primary)] to-transparent" />
      </div>

      {/* Ícones sociais */}
      <div className="flex flex-col gap-3 md:gap-4">
        {socials.map((social) => (
          <motion.div
            key={social.name}
            onClick={() => handleSocialClick(social.url, social.appUrl)}
            whileHover={{ scale: 1.1, y: -2 }}
            className="group relative flex items-center justify-center w-10 h-10 bg-[var(--social-bg)] border border-[var(--border-primary)] rounded-xl transition-all duration-300 cursor-pointer hover:bg-[var(--accent-soft)] hover:border-[var(--accent-start)]/30"
            title={social.name}
          >
            {/* Efeito Glow no Hover - Otimizado para Tema */}
            <div 
              className="absolute inset-0 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ background: social.color + "33" }}
            />
            <div className="relative z-10 opacity-[var(--social-icon-opacity)] group-hover:opacity-100 transition-all duration-300 scale-90 md:scale-100">
              {social.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Linha Inferior */}
      <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[var(--border-primary)] to-transparent mt-2" />
    </motion.div>
  );
}
