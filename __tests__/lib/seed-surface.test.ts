import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Lote 4 do `BUG-103` — seeds que escreviam pela rede sem guard.
 *
 * Dois casos, dois tratamentos:
 * - `seedInitialProductsAction` era orfa (zero callers) e escrevia o catalogo de
 *   produtos. Removida — mesmo precedente do `BUG-039`.
 * - `seedInvitationEventAndTokens` roda no Server Component publico de convite.
 *   Guardar quebraria a pagina; a logica foi para uma lib (sem `"use server"`),
 *   removendo o endpoint de rede sem mudar o comportamento (Protocolo item 8).
 */

const raiz = process.cwd();
const existe = (rel: string) => fs.existsSync(path.join(raiz, rel));
const ler = (rel: string) => fs.readFileSync(path.join(raiz, rel), "utf8");
const codigoDe = (rel: string) =>
  ler(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("seed de produtos orfao foi removido", () => {
  it("o arquivo seed-products.ts nao existe mais", () => {
    expect(existe("src/actions/seed-products.ts")).toBe(false);
  });

  it("nenhum arquivo ainda referencia seedInitialProductsAction", () => {
    const varrer = (dir: string, hits: string[] = []): string[] => {
      for (const e of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) varrer(rel, hits);
        else if (/\.tsx?$/.test(e.name) && ler(rel).includes("seedInitialProductsAction")) hits.push(rel);
      }
      return hits;
    };
    expect(varrer("src")).toEqual([]);
  });
});

describe("seed de convite saiu da superficie de rede", () => {
  it("a logica vive numa lib que NAO e 'use server'", () => {
    const lib = ler("src/lib/invitations/seed.ts");
    expect(lib).toMatch(/export async function bootstrapPreInauguracaoInvitation/);
    expect(lib).not.toMatch(/^\s*["']use server["']/);
  });

  it("invitations.ts (use server) nao exporta mais o seed", () => {
    // Se voltar a ser exportada daqui, volta a ser endpoint de rede.
    expect(codigoDe("src/actions/invitations.ts")).not.toMatch(/export async function seedInvitationEventAndTokens/);
  });

  it("a pagina de convite chama a lib, nao a action antiga", () => {
    const page = codigoDe("src/app/convites/[slug]/page.tsx");
    expect(page).toMatch(/bootstrapPreInauguracaoInvitation/);
    expect(page).not.toMatch(/seedInvitationEventAndTokens/);
  });
});
