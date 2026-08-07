import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CvContactFilter } from "@/components/forms/SurveyFields/CvContactFilter";

/**
 * T-06 / Onda 3B — mesma rede de seguranca de `cv-resumo-editor.test.tsx`,
 * aplicada ao filtro de contatos.
 *
 * O risco e' o mesmo e igualmente silencioso: `masterCvData` chega de forma
 * ASSINCRONA. Se o preenchimento passar a depender so do inicializador de
 * `useState`, o usuario abre o formulario e nao ve nenhum contato — a lista
 * renderiza vazia porque cada item so aparece quando tem valor (`if (!item.value)
 * return null`), sem erro em tela.
 */

afterEach(cleanup);

const MESTRE = {
  nome_completo: "Fulano de Tal",
  email_profissional: "fulano@exemplo.com",
  telefone: "11 90000-0000",
  linkedin: "linkedin.com/in/fulano",
  portfolio: "fulano.dev",
  localizacao: "Sao Paulo, SP"
};

describe("CvContactFilter: os contatos nao podem aparecer vazios", () => {
  it("preenche a partir do curriculo mestre quando nao ha resposta salva", () => {
    render(<CvContactFilter value={null} masterCvData={MESTRE} onChange={vi.fn()} />);

    expect(screen.getByText("Fulano de Tal")).toBeDefined();
    expect(screen.getByText("fulano@exemplo.com")).toBeDefined();
    expect(screen.getByText("Sao Paulo, SP")).toBeDefined();
  });

  it("preenche quando o curriculo mestre chega DEPOIS da primeira renderizacao", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvContactFilter value={null} masterCvData={null} onChange={onChange} />
    );

    // Primeira renderizacao: dado ainda nao chegou do servidor.
    expect(screen.queryByText("Fulano de Tal")).toBeNull();

    rerender(<CvContactFilter value={null} masterCvData={MESTRE} onChange={onChange} />);

    expect(screen.getByText("Fulano de Tal")).toBeDefined();
    expect(screen.getByText("11 90000-0000")).toBeDefined();
  });

  it("propaga o preenchimento para o motor de formularios", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvContactFilter value={null} masterCvData={undefined} onChange={onChange} />
    );

    rerender(<CvContactFilter value={null} masterCvData={MESTRE} onChange={onChange} />);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nome_completo: { value: "Fulano de Tal", visible: true }
      })
    );
  });

  it("resposta salva tem prioridade sobre o curriculo mestre", () => {
    const salva = {
      nome_completo: { value: "Nome Ja Editado", visible: true },
      email_profissional: { value: "editado@exemplo.com", visible: true }
    };

    render(<CvContactFilter value={salva} masterCvData={MESTRE} onChange={vi.fn()} />);

    expect(screen.getByText("Nome Ja Editado")).toBeDefined();
    expect(screen.queryByText("Fulano de Tal")).toBeNull();
  });

  it("nao quebra quando nao ha nem resposta salva nem curriculo mestre", () => {
    render(<CvContactFilter value={null} masterCvData={null} onChange={vi.fn()} />);

    expect(screen.queryByText("Fulano de Tal")).toBeNull();
  });
});
