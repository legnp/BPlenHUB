"use client";

import React, { useState, useEffect } from "react";
import { AdminProductBuilder } from "@/components/admin/AdminProductBuilder";
import { Package, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase"; // Usando cliente para busca rápida (Admin check assume-se passado)
import { doc, getDoc } from "firebase/firestore";
import { Product } from "@/types/products";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * Edicao de Produto — BPlen HUB
 * Permite a edicao de um produto existente.
 */
export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!params.id) return;
      try {
        const docRef = doc(db, "products", params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] opacity-30">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Carregando Ficha Técnica...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-red-500">
         Produto não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-6">

      <FunctionalPageHeader
        eyebrow="Comercial"
        title="Editar"
        titleAccent="Produto"
        backHref="/admin/products"
        backLabel="Lista de Produtos"
        icon={<Package size={24} />}
        statusTag={{ label: product.title, tone: "neutral" }}
      />

      {/* Builder Component */}
      <AdminProductBuilder initialProduct={product} />

    </div>
  );
}
