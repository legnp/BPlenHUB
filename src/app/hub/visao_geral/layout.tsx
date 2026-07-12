import type { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Visão Geral" };

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
