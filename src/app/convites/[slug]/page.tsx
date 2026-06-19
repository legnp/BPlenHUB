import React from "react";
import { Metadata } from "next";
import { getInvitationEventAction, seedInvitationEventAndTokens } from "@/actions/invitations";
import { InvitationSurvey } from "@/components/invitations/InvitationSurvey";
import { BPlenLogo } from "@/components/shared/BPlenLogo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getInvitationEventAction(slug);

  if (res.success && res.data) {
    return {
      title: `${res.data.name} | BPlen HUB`,
      description: `Voce foi convidado para ${res.data.name}. Participe do nosso processo exclusivo de RSVP e confirmacao.`,
    };
  }

  return {
    title: "Convite Exclusivo | BPlen HUB",
    description: "Convites para eventos exclusivos do ecossistema BPlen HUB.",
  };
}

export default async function InvitationPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Garantimos o Seed automático se o evento 'pre_inauguracao' ainda nao existir
  if (slug === "pre_inauguracao") {
    const checkExist = await getInvitationEventAction(slug);
    if (!checkExist.success) {
      console.log("[InvitationPage] Auto-seeding pre_inauguracao event and tokens...");
      await seedInvitationEventAndTokens();
    }
  }

  const result = await getInvitationEventAction(slug);

  if (!result.success || !result.data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#000000] text-white px-4">
        <div 
          className="p-8 max-w-md w-full text-center rounded-3xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex justify-center mb-6">
            <BPlenLogo size={42} variant="hub" />
          </div>
          <h1 className="text-xl font-bold mb-2">Acesso Invalido</h1>
          <p className="text-sm text-gray-400 mb-6">
            O link de convite acessado nao corresponde a um evento ativo ou expirou. Por favor, verifique se o endereço está correto.
          </p>
          <a
            href="https://bplen.com"
            className="inline-block px-6 py-2.5 rounded-xl font-medium text-xs tracking-wider uppercase bg-white text-[#1d1d1f] hover:bg-gray-100 transition-all hover:scale-105"
          >
            Ir para BPlen.com
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#000000]">
      <InvitationSurvey event={result.data} />
    </main>
  );
}
