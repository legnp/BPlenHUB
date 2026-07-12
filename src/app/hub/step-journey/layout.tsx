import type { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Jornada" };

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
