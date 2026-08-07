import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CvResumoEditor } from "@/components/forms/SurveyFields/CvResumoEditor";

/**
 * T-06 / Onda 3B — rede de seguranca para a correcao de `set-state-in-effect`
 * nos campos `Cv*`.
 *
 * O risco documentado no plano e' silencioso: `masterCvData` chega de forma
 * ASSINCRONA, e uma correcao que use apenas inicializador de `useState` captura
 * `undefined` na primeira renderizacao. O resultado e' o usuario abrir o
 * formulario e encontrar o campo VAZIO em vez do texto que ja tinha cadastrado,
 * sem nenhum erro em tela.
 *
 * Estes testes fixam o comportamento observavel ANTES da refatoracao, para que
 * a correcao seja verificavel em vez de confiada.
 */

afterEach(cleanup);

const RESUMO_MESTRE = "Resumo profissional vindo do curriculo mestre";
const RESPOSTA_SALVA = "Resposta que o usuario ja tinha salvo";

const campo = () => screen.getByRole("textbox") as HTMLTextAreaElement;

describe("CvResumoEditor: o campo nao pode aparecer vazio", () => {
  it("preenche a partir do curriculo mestre quando nao ha resposta salva", () => {
    render(
      <CvResumoEditor
        value=""
        masterCvData={{ resumo_profissional: RESUMO_MESTRE }}
        onChange={vi.fn()}
      />
    );

    expect(campo().value).toBe(RESUMO_MESTRE);
  });

  it("preenche quando o curriculo mestre chega DEPOIS da primeira renderizacao", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvResumoEditor value="" masterCvData={null} onChange={onChange} />
    );

    // Primeira renderizacao: dado ainda nao chegou do servidor.
    expect(campo().value).toBe("");

    rerender(
      <CvResumoEditor
        value=""
        masterCvData={{ resumo_profissional: RESUMO_MESTRE }}
        onChange={onChange}
      />
    );

    expect(campo().value).toBe(RESUMO_MESTRE);
  });

  it("propaga o valor preenchido para o motor de formularios", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvResumoEditor value="" masterCvData={undefined} onChange={onChange} />
    );

    rerender(
      <CvResumoEditor
        value=""
        masterCvData={{ resumo_profissional: RESUMO_MESTRE }}
        onChange={onChange}
      />
    );

    // Sem esta propagacao o texto apareceria na tela mas nao seria salvo como
    // resposta do survey.
    expect(onChange).toHaveBeenCalledWith(RESUMO_MESTRE);
  });

  it("resposta salva tem prioridade sobre o curriculo mestre", () => {
    render(
      <CvResumoEditor
        value={RESPOSTA_SALVA}
        masterCvData={{ resumo_profissional: RESUMO_MESTRE }}
        onChange={vi.fn()}
      />
    );

    expect(campo().value).toBe(RESPOSTA_SALVA);
  });

  it("nao quebra quando nao ha nem resposta salva nem curriculo mestre", () => {
    render(<CvResumoEditor value="" masterCvData={null} onChange={vi.fn()} />);

    expect(campo().value).toBe("");
  });
});
