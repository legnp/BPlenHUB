import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CvExperienceFilter } from "@/components/forms/SurveyFields/CvExperienceFilter";

/**
 * T-06 / Onda 3B — mesma rede de seguranca dos demais campos `Cv*`.
 *
 * Como no filtro de formacao, o estado comecava VAZIO e todo o preenchimento
 * acontecia dentro do efeito. Perder o caminho assincrono faria a etapa de
 * experiencia abrir sem nenhum cargo listado.
 *
 * Cobre tambem a normalizacao de `conquistas`, que chega ora como string, ora
 * como objeto, dependendo de como foi salva.
 */

afterEach(cleanup);

const MESTRE = {
  experiencias: [
    {
      cargo: "Coordenador de Operacoes",
      empresa: "Empresa Anterior",
      periodo: "2019 - 2023",
      contexto: "Area de logistica",
      conquistas: ["Reduziu custo em 20 por cento", { conquista: "Estruturou o time" }]
    }
  ]
};

const props = {
  targetPositionDescription: "Descricao da vaga alvo",
  targetPositionName: "Gerente",
  targetEmpresaName: "Empresa Alvo",
  senioridadePretendida: "Pleno"
};

describe("CvExperienceFilter: as experiencias nao podem sumir", () => {
  it("preenche a partir do curriculo mestre quando nao ha resposta salva", () => {
    render(
      <CvExperienceFilter value={null} masterCvData={MESTRE} onChange={vi.fn()} {...props} />
    );

    expect(screen.getByText(/Coordenador de Operacoes/)).toBeDefined();
    expect(screen.getByText("Empresa Anterior")).toBeDefined();
  });

  it("preenche quando o curriculo mestre chega DEPOIS da primeira renderizacao", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvExperienceFilter value={null} masterCvData={null} onChange={onChange} {...props} />
    );

    expect(screen.queryByText("Empresa Anterior")).toBeNull();

    rerender(
      <CvExperienceFilter value={null} masterCvData={MESTRE} onChange={onChange} {...props} />
    );

    expect(screen.getByText(/Coordenador de Operacoes/)).toBeDefined();
  });

  it("normaliza conquistas vindas como string e como objeto", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CvExperienceFilter value={null} masterCvData={undefined} onChange={onChange} {...props} />
    );

    rerender(
      <CvExperienceFilter value={null} masterCvData={MESTRE} onChange={onChange} {...props} />
    );

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        cargo: "Coordenador de Operacoes",
        conquistas: [
          { conquista: "Reduziu custo em 20 por cento", visible: true },
          { conquista: "Estruturou o time", visible: true }
        ]
      })
    ]);
  });

  it("resposta salva tem prioridade sobre o curriculo mestre", () => {
    const salva = [
      {
        cargo: "Cargo Ja Editado",
        empresa: "Empresa Salva",
        periodo: "2020 - 2024",
        contexto: "",
        visible: true,
        conquistas: []
      }
    ];

    render(
      <CvExperienceFilter value={salva} masterCvData={MESTRE} onChange={vi.fn()} {...props} />
    );

    expect(screen.getByText(/Cargo Ja Editado/)).toBeDefined();
    expect(screen.queryByText("Empresa Anterior")).toBeNull();
  });

  it("nao quebra quando nao ha nem resposta salva nem curriculo mestre", () => {
    render(<CvExperienceFilter value={null} masterCvData={null} onChange={vi.fn()} {...props} />);

    expect(screen.queryByText("Empresa Anterior")).toBeNull();
  });
});
