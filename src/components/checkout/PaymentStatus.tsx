"use client";

import React from "react";
import { StatusScreen } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

interface PaymentStatusProps {
  paymentId: string;
}

/**
 * BPlen HUB — Payment Status Screen (🏁)
 * Exibe o resultado do pagamento utilizando o Status Screen Brick.
 * Garante uma experiência de fechamento premium.
 */

export function PaymentStatus({ paymentId }: PaymentStatusProps) {
  const router = useRouter();

  const initialization = {
    paymentId: paymentId,
  };

  const customization = {
    visual: {
      showChecklist: true,
      smartAutocomplete: true,
      hideStatusDetails: false,
      hideTransactionId: false,
    },
    backUrls: {
      return: `${window.location.origin}/hub/membro?startTour=true`,
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10">
      
      <div className="bg-[#121212] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
        <StatusScreen
          initialization={initialization}
          customization={customization}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
         <Link 
           href="/hub/membro?startTour=true" 
           className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3"
         >
            <Home size={16} /> Ir para o Dashboard
         </Link>
         <Link 
           href="/hub/journey?startTour=part2" 
           className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
         >
            Ver Minha Jornada <ArrowRight size={16} />
         </Link>
      </div>

    </div>
  );
}
