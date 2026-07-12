import type { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Gestão de Carreira" };

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
