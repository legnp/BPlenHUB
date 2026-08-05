import { FormConfig } from "@/types/forms";

/**
 * BPlen HUB — Formulário: Dados Cadastrais do Parceiro
 *
 * Classificacao (CLAUDE.md — SURVEY_GLOBAL.md vs FORMS_GLOBAL.md): **FORM**.
 * E' coleta operacional (identificacao, emissao de documentos e repasse), com modos
 * create/edit/view e dado que evolui — nao e' diagnostico. A parada IRMA, de acolhimento
 * e acordos, e' a survey `partner_check_in`.
 *
 * Estrutura: o tipo de parceria (PF ou PJ) decide qual bloco aparece, reaproveitando
 * `logic.showIf`, o mesmo mecanismo de secao condicional ja usado em `dados-cadastrais.ts`
 * (endereco de faturamento). Nenhum motor novo.
 *
 * CNPJ e' informativo, SEM trava de unicidade — decisao da Gestora registrada no
 * PARTNER-AREA-EXPANSION-PLAN.md secao 9.6.
 */
export const partnerDadosCadastraisForm: FormConfig = {
  id: "partner_dados_cadastrais",
  kind: "form",
  title: "Dados Cadastrais da Parceria",
  submitLabel: "Salvar e Continuar",
  sheetNamePrefix: "Forms_partner_dados_cadastrais",
  sections: [
    {
      id: "identificacao",
      title: "Identificação BPlen",
      description: "Estes dados vêm da sua conta e não são alterados por aqui.",
      fields: [
        {
          id: "matricula",
          type: "text",
          label: "Sua Matrícula",
          readOnly: true,
          required: true
        },
        {
          id: "email",
          type: "text",
          label: "E-mail de Conexão",
          readOnly: true,
          required: true
        },
        {
          id: "user_name",
          type: "text",
          label: "Nome Associado à Conta",
          readOnly: true,
          required: true
        }
      ]
    },
    {
      id: "tipo_parceria",
      title: "Tipo de Parceria",
      description: "Define como emitimos os documentos e fazemos os repasses da parceria.",
      fields: [
        {
          id: "partner_type",
          type: "choice",
          label: "Você atua como pessoa física ou por meio de uma empresa?",
          options: [
            { label: "Pessoa física (CPF)", value: "PF" },
            { label: "Pessoa jurídica (CNPJ)", value: "PJ" }
          ],
          required: true
        }
      ]
    },
    {
      id: "dados_pessoais",
      title: "Dados Pessoais",
      description: "Informações de identificação e contato do parceiro.",
      fields: [
        {
          id: "full_name",
          type: "text",
          label: "Nome Completo (sem abreviações)",
          placeholder: "Digite seu nome completo",
          required: true
        },
        {
          id: "cpf",
          type: "text",
          label: "CPF",
          placeholder: "000.000.000-00",
          mask: "cpf",
          validation: "cpf",
          required: true
        },
        {
          id: "birth_date",
          type: "date",
          label: "Data de Nascimento",
          required: true
        },
        {
          id: "phone",
          type: "text",
          label: "Telefone de Contato",
          placeholder: "(00) 00000-0000",
          mask: "phone",
          required: true
        }
      ]
    },
    {
      id: "dados_empresa",
      title: "Dados da Empresa",
      description: "Preencha com os dados oficiais da empresa que emitirá os documentos.",
      logic: {
        showIf: {
          fieldId: "partner_type",
          value: "PJ"
        }
      },
      fields: [
        {
          id: "cnpj",
          type: "text",
          label: "CNPJ",
          placeholder: "00.000.000/0000-00",
          required: true
        },
        {
          id: "razao_social",
          type: "text",
          label: "Razão Social",
          placeholder: "Como consta no registro da empresa",
          required: true
        },
        {
          id: "nome_fantasia",
          type: "text",
          label: "Nome Fantasia",
          placeholder: "Nome pelo qual a empresa é conhecida",
          required: true
        },
        {
          id: "company_cep",
          type: "text",
          label: "CEP da Empresa",
          placeholder: "00000-000",
          mask: "cep",
          required: true
        },
        {
          id: "company_rua",
          type: "text",
          label: "Logradouro (Rua/Av)",
          placeholder: "Ex: Av. Paulista",
          required: true
        },
        {
          id: "company_numero",
          type: "text",
          label: "Número",
          placeholder: "Ex: 123",
          required: true
        },
        {
          id: "company_complemento",
          type: "text",
          label: "Complemento",
          placeholder: "Ex: Sala 42",
          required: false
        },
        {
          id: "company_bairro",
          type: "text",
          label: "Bairro",
          placeholder: "Ex: Bela Vista",
          required: true
        },
        {
          id: "company_cidade",
          type: "text",
          label: "Cidade",
          placeholder: "Ex: Campinas",
          required: true
        },
        {
          id: "company_uf",
          type: "text",
          label: "Estado (UF)",
          placeholder: "Ex: SP",
          required: true
        }
      ]
    },
    {
      id: "endereco_parceiro",
      title: "Endereço",
      description: "Endereço residencial do parceiro.",
      logic: {
        showIf: {
          fieldId: "partner_type",
          value: "PF"
        }
      },
      fields: [
        {
          id: "cep",
          type: "text",
          label: "CEP",
          placeholder: "00000-000",
          mask: "cep",
          required: true
        },
        {
          id: "rua",
          type: "text",
          label: "Logradouro (Rua/Av)",
          placeholder: "Ex: Av. Paulista",
          required: true
        },
        {
          id: "numero",
          type: "text",
          label: "Número",
          placeholder: "Ex: 123",
          required: true
        },
        {
          id: "complemento",
          type: "text",
          label: "Complemento",
          placeholder: "Ex: Apto 42",
          required: false
        },
        {
          id: "bairro",
          type: "text",
          label: "Bairro",
          placeholder: "Ex: Bela Vista",
          required: true
        },
        {
          id: "cidade",
          type: "text",
          label: "Cidade",
          placeholder: "Ex: Campinas",
          required: true
        },
        {
          id: "uf",
          type: "text",
          label: "Estado (UF)",
          placeholder: "Ex: SP",
          required: true
        }
      ]
    },
    {
      id: "dados_repasse",
      title: "Dados para Repasse",
      description: "Para onde enviamos os repasses da parceria.",
      fields: [
        {
          id: "pix_key",
          type: "text",
          label: "Chave PIX",
          placeholder: "CPF, CNPJ, e-mail, telefone ou chave aleatória",
          required: true
        },
        {
          id: "bank_holder",
          type: "text",
          label: "Titular da Conta",
          placeholder: "Nome do titular, como consta no banco",
          required: true
        }
      ]
    }
  ]
};
