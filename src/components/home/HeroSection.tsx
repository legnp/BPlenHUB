import { HeroHeadline } from "./HeroHeadline";

/**
 * HeroSection (Bloco da Home 🚀)
 * A majestosa entrada Dark Premium da nova Consultoria BPlen.
 */
export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-6 text-center">
      
      {/* 🔮 Background Glow Elements (Aura Premium) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff0080] rounded-full blur-[150px] opacity-[0.08] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-[0.05] pointer-events-none -z-10" />

      {/* 🏔️ Content */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        
        {/* Gigantic Clickable Headline — Agora isolado em Client Component */}
        <HeroHeadline />
        
      </div>

    </section>
  );
}

