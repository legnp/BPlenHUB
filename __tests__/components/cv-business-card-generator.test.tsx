import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CvBusinessCardGenerator } from "@/components/forms/SurveyFields/CvBusinessCardGenerator";

/**
 * T-06 / Onda 3B — ultimo dos cinco campos `Cv*`.
 *
 * Este era o mais invasivo: escrevia NOVE estados de uma vez dentro do efeito.
 * A correcao mantem os mesmos nomes de variaveis e setters, trocando so a
 * origem — de estado copiado para valor derivado — de modo que o JSX inteiro
 * seguiu inalterado.
 *
 * Diferenca deliberada em relacao aos outros quatro campos: aqui o ramo do
 * curriculo mestre NUNCA chamou `onChange`. O preenchimento so era exibido, e a
 * gravacao acontecia quando o usuario mexia em algo. O ultimo teste fixa esse
 * comportamento para que nao seja "corrigido" por engano no futuro.
 */

afterEach(cleanup);

const MESTRE = {
  nome_completo: "Fulano de Tal",
  telefone: "11 90000-0000",
  email_profissional: "fulano@exemplo.com",
  linkedin: "linkedin.com/in/fulano",
  portfolio: "fulano.dev"
};

describe("CvBusinessCardGenerator: o cartao nao pode aparecer vazio", () => {
  it("preenche a partir do curriculo mestre quando nao ha resposta salva", () => {
    render(<CvBusinessCardGenerator value={null} masterCvData={MESTRE} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Fulano de Tal")).toBeDefined();
    expect(screen.getByDisplayValue("11 90000-0000")).toBeDefined();
    expect(screen.getByDisplayValue("fulano@exemplo.com")).toBeDefined();
  });

  it("preenche quando o curriculo mestre chega DEPOIS da primeira renderizacao", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvBusinessCardGenerator value={null} masterCvData={null} onChange={onChange} />
    );

    expect(screen.queryByDisplayValue("Fulano de Tal")).toBeNull();

    rerender(<CvBusinessCardGenerator value={null} masterCvData={MESTRE} onChange={onChange} />);

    expect(screen.getByDisplayValue("Fulano de Tal")).toBeDefined();
    expect(screen.getByDisplayValue("fulano.dev")).toBeDefined();
  });

  it("resposta salva tem prioridade sobre o curriculo mestre", () => {
    const salva = {
      name: "Nome Ja Editado",
      phone: "11 98888-8888",
      pitch: "Meu pitch salvo"
    };

    render(<CvBusinessCardGenerator value={salva} masterCvData={MESTRE} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Nome Ja Editado")).toBeDefined();
    expect(screen.getByDisplayValue("Meu pitch salvo")).toBeDefined();
    expect(screen.queryByDisplayValue("Fulano de Tal")).toBeNull();
  });

  it("campos ausentes na resposta salva caem para o curriculo mestre", () => {
    // A resposta salva so tem o nome; o restante deve continuar vindo do mestre.
    render(
      <CvBusinessCardGenerator
        value={{ name: "So o Nome Salvo" }}
        masterCvData={MESTRE}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("So o Nome Salvo")).toBeDefined();
    expect(screen.getByDisplayValue("11 90000-0000")).toBeDefined();
  });

  it("nao grava resposta apenas por exibir o preenchimento do mestre", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvBusinessCardGenerator value={null} masterCvData={null} onChange={onChange} />
    );

    rerender(<CvBusinessCardGenerator value={null} masterCvData={MESTRE} onChange={onChange} />);

    // Comportamento original preservado: o cartao aparece preenchido, mas a
    // resposta so e' gravada quando o usuario interage.
    expect(onChange).not.toHaveBeenCalled();
  });
});
