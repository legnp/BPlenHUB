import type { ReactNode } from "react";
import { Metadata } from "next";
import { getProductBySlug } from "@/actions/products";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug, true);
    return { title: product?.title || "Serviço" };
  } catch {
    return { title: "Serviço" };
  }
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
