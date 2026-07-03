"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Phone } from "lucide-react";

/**
 * FloatingSupport — Central de Contato & Redes (Bottom Right)
 * Design fixo para Hub e Admin.
 * Reúne WhatsApp e Redes Sociais conforme a nova governança visual.
 */

const SOCIAL_LINKS = [
  { id: "linkedin", href: "https://www.linkedin.com/in/lisandralencina/", icon: <LinkedinIcon className="w-4 h-4" />, label: "LinkedIn" },
  { id: "instagram", href: "https://www.instagram.com/lis_lencina", icon: <InstagramIcon className="w-4 h-4" />, label: "Instagram" },
  { id: "tiktok", href: "https://www.tiktok.com/@lis.lencina", icon: <TikTokIcon className="w-4 h-4" />, label: "TikTok" },
];

export function FloatingSupport() {
  return (
    <div className="fixed bottom-8 right-8 z-chrome flex flex-col items-center gap-3">
      
      {/* Stack de Redes Sociais (Aparecem escalonadas) */}
      <div className="flex flex-col gap-2 mb-2">
         {SOCIAL_LINKS.map((social, idx) => (
            <motion.div
               key={social.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
            >
               <Link
                  href={social.href}
                  target="_blank"
                  className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 hover:bg-black/60 transition-all group shadow-xl"
                  title={social.label}
               >
                  <div className="group-hover:scale-110 transition-transform">
                     {social.icon}
                  </div>
               </Link>
            </motion.div>
         ))}
      </div>

      {/* Botão Principal WhatsApp */}
      <motion.div
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.3, duration: 0.5 }}
      >
         <Link 
            href="https://wa.me/5511945152088" 
            target="_blank"
            className="w-16 h-16 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_15px_35px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all relative group"
            title="Falar com Especialista"
         >
            <Phone size={28} className="relative z-10" />
         </Link>
      </motion.div>
    </div>
  );
}

// Icons (SVG Locais para evitar dependências extras)
function LinkedinIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;
}

function InstagramIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
}

function TikTokIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.707 8.707 0 0 1-1.87-1.42v10.37a7.51 7.51 0 1 1-7.51-7.51c.03.01.06 0 .09.01v4.03c-1.23-.39-2.6-.13-3.63.63-1.09.81-1.63 2.15-1.43 3.49.2 1.34 1.25 2.45 2.57 2.77.82.3 2.03.11 2.71-.35 1.05-.72 1.62-2 1.64-3.23.01-1.93 0-3.87 0-5.8 0-4.15 0-8.3 0-12.45z"/></svg>;
}
