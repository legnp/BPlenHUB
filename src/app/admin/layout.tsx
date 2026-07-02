import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "Administração",
    template: "BPlen | %s",
  },
  description: "Painel de controle administrativo do ecossistema BPlen.",
};

/**
 * ADMIN LAYOUT — Gate de Autorização Server-Side (paridade com o hub) 🛡️
 * O servidor decide a autorização ANTES de enviar o HTML/JS ao cliente,
 * espelhando `requireAdmin`: sessão válida + não-suspenso + papel de admin.
 * O guard client em `AdminLayoutClient` permanece como segunda camada.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session || session.role === "suspended" || !session.isAdmin) {
    console.log("🚦 [Admin Gate] Acesso não autorizado. Redirecionamento Server-Side...");
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
