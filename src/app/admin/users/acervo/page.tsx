import React from "react";
import { Metadata } from "next";
import { UsersTabs } from "@/components/admin/UsersTabs";
import { DriveBackfillView } from "@/components/admin/DriveBackfillView";

export const metadata: Metadata = {
  title: "Acervo",
  description: "Resgate retroativo do acervo de respostas do membro.",
};

/**
 * Aba Acervo (resgate retroativo). Orquestradora: monta as sub-abas de Pessoas e
 * delega a execucao/render para DriveBackfillView (client + server actions).
 */
export default function AcervoPage() {
  return (
    <div className="space-y-10 animate-fade-in-up">
      <UsersTabs />
      <DriveBackfillView />
    </div>
  );
}
