import type { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout" };

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
