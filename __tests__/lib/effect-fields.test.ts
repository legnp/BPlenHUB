import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * `BUG-109` — os efeitos leem campos que EXISTEM nos surveys?
 *
 * O `handleContentFeedbackEffect` lia `responses.utilidade` e
 * `responses.comentarios` — campos que **nunca existiram** no survey
 * `content_evaluation`, que declara `rating` e `comment` (e e o que o modal
 * envia). O `|| "N/A"` engoliu a divergencia: o dado ia **integro** para o
 * Firestore e chegava **vazio** na planilha do Drive.
 *
 * Isso importa mais do que parece: o Drive e a **estrategia de backup
 * independente da plataforma** da Gestora. Um espelho que grava "N/A" e um
 * backup oco — e o silencio do fallback fez isso passar por meses, em avaliacoes
 * logadas E anonimas.
 *
 * Este teste cruza, para TODO efeito, os campos lidos contra os ids declarados
 * nos configs — para a proxima divergencia falhar alto em vez de virar "N/A".
 */

const raiz = process.cwd();
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Ids de campo declarados em qualquer definicao de survey/form. */
function idsDeclarados(): Set<string> {
  const ids = new Set<string>();
  const dirs = ["src/config/surveys/definitions", "src/config/surveys", "src/config/forms"];
  for (const d of dirs) {
    const abs = path.join(raiz, d);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (!f.endsWith(".ts")) continue;
      const t = fs.readFileSync(path.join(abs, f), "utf8");
      for (const m of t.matchAll(/id:\s*["'`]([\w.-]+)["'`]/g)) ids.add(m[1]);
    }
  }
  return ids;
}

/** Campos que cada effect le de `responses`. */
function camposLidos(): Array<{ arquivo: string; linha: number; campo: string }> {
  const out: Array<{ arquivo: string; linha: number; campo: string }> = [];
  const dir = path.join(raiz, "src/actions/effects");
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts")) continue;
    fs.readFileSync(path.join(dir, f), "utf8").split("\n").forEach((linha, i) => {
      // ignora comentarios: eles citam os campos errados para explicar o bug
      if (/^\s*(\/\/|\*)/.test(linha)) return;
      for (const m of linha.matchAll(/responses\.([\wá-úÁ-Ú]+)/g)) {
        if (m[1] === "metadata") continue; // interno, nao e resposta do usuario
        out.push({ arquivo: f, linha: i + 1, campo: m[1] });
      }
    });
  }
  return out;
}

describe("efeitos leem campos que existem nos surveys", () => {
  const declarados = idsDeclarados();
  const declaradosNorm = new Set([...declarados].map(norm));
  const lidos = camposLidos();

  it("o levantamento encontra configs e leituras (sanidade do teste)", () => {
    // Sem isto o teste passaria vaziamente — falso verde ja aconteceu 3x nesta auditoria.
    expect(declarados.size).toBeGreaterThan(100);
    expect(lidos.length).toBeGreaterThan(20);
  });

  it("todo campo lido existe no config OU e a convencao `_other` do motor", () => {
    // `${field.id}_other` e gerado em RUNTIME pelo SurveyEngine quando o usuario
    // escolhe "Outro" — legitimamente nao aparece como `id:` no config.
    const suspeitos = lidos.filter(l => {
      if (declarados.has(l.campo) || declaradosNorm.has(norm(l.campo))) return false;
      if (l.campo.endsWith("_other")) {
        const base = l.campo.slice(0, -"_other".length);
        return !(declarados.has(base) || declaradosNorm.has(norm(base)));
      }
      return true;
    });

    expect(
      suspeitos.map(s => `${s.arquivo}:${s.linha} responses.${s.campo}`),
      "Efeito lendo campo que nenhum survey declara. O `|| \"N/A\"` vai engolir e o " +
      "espelho no Drive grava vazio — foi exatamente o BUG-109."
    ).toEqual([]);
  });

  it("o feedback de conteudo le rating/comment (os campos reais)", () => {
    const t = fs.readFileSync(path.join(raiz, "src/actions/effects/misc-surveys.ts"), "utf8");
    const ini = t.indexOf("export async function handleContentFeedbackEffect");
    const corpo = t.slice(ini, ini + 1200);
    expect(corpo).toMatch(/responses\.rating/);
    expect(corpo).toMatch(/responses\.comment\b/);
    expect(corpo, "voltou a ler o campo inexistente").not.toMatch(/responses\.utilidade/);
  });
});
