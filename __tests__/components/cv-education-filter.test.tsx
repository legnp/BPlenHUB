import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CvEducationFilter } from "@/components/forms/SurveyFields/CvEducationFilter";

/**
 * T-06 / Onda 3B — mesma rede de seguranca dos demais campos `Cv*`.
 *
 * Aqui o risco e' o mais visivel dos cinco: o estado comecava VAZIO e todo o
 * preenchimento acontecia dentro do efeito. Se a correcao perdesse o caminho
 * assincrono, a pessoa abriria a etapa de formacao e nao veria nenhum curso nem
 * certificacao — tela vazia, sem erro.
 */

afterEach(cleanup);

const MESTRE = {
  formacoes: [
    {
      grau: "Bacharelado",
      curso: "Administracao",
      instituicao: "Universidade Exemplo",
      ano_conclusao: "2018",
      destaques: "Monitoria"
    }
  ],
  certificacoes_projetos: [
    {
      nome: "Certificacao de Gestao",
      instituicao: "Instituto Exemplo",
      data: "2020",
      objetivo: "Aprofundar gestao de equipes",
      conquistas: []
    }
  ]
};

const props = {
  targetPositionName: "Gerente",
  targetEmpresaName: "Empresa Alvo"
};

describe("CvEducationFilter: formacoes e certificacoes nao podem sumir", () => {
  it("preenche a partir do curriculo mestre quando nao ha resposta salva", () => {
    render(
      <CvEducationFilter value={null} masterCvData={MESTRE} onChange={vi.fn()} {...props} />
    );

    expect(screen.getByText(/Administracao/)).toBeDefined();
    expect(screen.getByText("Universidade Exemplo")).toBeDefined();
  });

  it("preenche quando o curriculo mestre chega DEPOIS da primeira renderizacao", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvEducationFilter value={null} masterCvData={null} onChange={onChange} {...props} />
    );

    expect(screen.queryByText("Universidade Exemplo")).toBeNull();

    rerender(
      <CvEducationFilter value={null} masterCvData={MESTRE} onChange={onChange} {...props} />
    );

    expect(screen.getByText(/Administracao/)).toBeDefined();
    expect(screen.getByText("Universidade Exemplo")).toBeDefined();
  });

  it("propaga o preenchimento para o motor de formularios", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvEducationFilter value={null} masterCvData={undefined} onChange={onChange} {...props} />
    );

    rerender(
      <CvEducationFilter value={null} masterCvData={MESTRE} onChange={onChange} {...props} />
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        formacoes: [expect.objectContaining({ curso: "Administracao", visible: true })]
      })
    );
  });

  it("resposta salva tem prioridade sobre o curriculo mestre", () => {
    const salva = {
      formacoes: [
        {
          grau: "Mestrado",
          curso: "Curso Ja Editado",
          instituicao: "Instituicao Salva",
          ano_conclusao: "2022",
          destaques: "",
          visible: true
        }
      ],
      certificacoes_projetos: []
    };

    render(
      <CvEducationFilter value={salva} masterCvData={MESTRE} onChange={vi.fn()} {...props} />
    );

    expect(screen.getByText(/Curso Ja Editado/)).toBeDefined();
    expect(screen.queryByText("Universidade Exemplo")).toBeNull();
  });

  it("nao quebra quando nao ha nem resposta salva nem curriculo mestre", () => {
    render(<CvEducationFilter value={null} masterCvData={null} onChange={vi.fn()} {...props} />);

    expect(screen.queryByText("Universidade Exemplo")).toBeNull();
  });
});
