"use client";

import React from "react";
import { AdminProductBuilder } from "@/components/admin/AdminProductBuilder";
import { Package } from "lucide-react";
import { FunctionalPageHeader } from "@/components/layout/FunctionalPageHeader";

/**
 * Nova Ficha de Produto — BPlen HUB
 * Ponto de entrada para criacao de novos produtos.
 */
export default function NewProductPage() {
  return (
    <div className="p-8 md:p-12 space-y-12 animate-fade-in pb-24 max-w-6xl mx-auto">

      <FunctionalPageHeader
        eyebrow="Comercial"
        title="Novo"
        titleAccent="Produto"
        backHref="/admin/products"
        backLabel="Lista de Produtos"
        icon={<Package size={24} />}
      />

      {/* Builder Component */}
      <AdminProductBuilder />

    </div>
  );
}
