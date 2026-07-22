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
    <div className="space-y-10 animate-fade-in pb-6">

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
