# Termo de Aliança e Parceria Estratégica — Guia de Preenchimento

Template: `contrato-de-parceria.template.html` · Chassi B · A4 vertical · 7 folhas.

**Antes de tudo:** este documento é o instrumento para relações B2B/B2C
**fora** do checkout do HUB (parceiro de indicação, aliança estratégica) —
não é o contrato de compra de serviço que o cliente assina dentro da
plataforma (aquele é gerado pelo sistema, `src/lib/contract-content.ts`, e
não deve ser confundido com este).

**Nota jurídica.** O conteúdo das cláusulas foi preservado **verbatim** do
documento fonte oficial da BPlen. Preencher os campos `{{ENTRE CHAVES}}` é
seguro — qualquer alteração no **texto das cláusulas em si** exige validação
de quem responde legalmente pela BPlen antes de enviar a um parceiro real.

---

## Estrutura

| Folha | Conteúdo |
| --- | --- |
| 1 | Identificação + Partes + Seção 1 (Objeto, Independência, Sem vínculo) |
| 2 | Seção 2 — Jornada e Comissionamento (2.1–2.2) — **condicional** |
| 3 | Seção 2, continuação (2.3–2.5) — **condicional** |
| 4 | Seção 3 — Governança (confidencialidade, marca, LGPD, rescisão, foro, aceite) |
| 5 | Seção 4 — Networking interno (4.1) |
| 6 | Seção 4, continuação — Vitrine pública (4.2) — **condicional** |
| 7 | Formalização (Digital ou Física — escolher uma) |

---

## Os dois blocos condicionais

Marcados com caixa tracejada âmbar na tela (some na impressão/PDF):

**Folhas 2–3 — Comissionamento.** Só entram se a parceria for **comercial,
remunerada** (o parceiro recebe 10% por indicação convertida). Se for uma
aliança institucional sem repasse financeiro, **apague as folhas 2 e 3
inteiras** e ajuste a numeração: Seção 3 (Governança) vira Seção 2, Seção 4
(Benefícios) vira Seção 3 — e revise as referências de "Cláusula 2.x" que
sobrarem no texto, se houver.

**Folha 6 — Vitrine pública.** Só entra se o parceiro tiver status de
"Parceiro Destaque" (exposição na página pública de parceiros). Sem esse
direito, apague a folha inteira — a Seção 4 fica só com 4.1 (folha 5) e o
documento cai para 6 folhas.

---

## Campos

| Campo | Como preencher |
| --- | --- |
| `{{BPL-TIPO-CTR-AAMMDDHHMM}}` | Código do documento. `TIPO` é o rótulo do tipo de parceria (`indicacao`, `hrbp`, `revenda`...) — minúsculo, sem acento, sem espaço. Repete em todo cabeçalho/rodapé. |
| `{{Nome completo ou razão social do parceiro}}` | Pessoa física ou jurídica — aparece 3 vezes (identificação, qualificação, assinatura). |
| `{{CPF ou CNPJ}}` | Do parceiro. Não confundir com o CNPJ da BPlen (já preenchido: `62.857.668/0001-07`, fixo, não editar). |
| `{{endereço}}` | Residência ou sede do parceiro. |
| `{{matrícula/ID do parceiro}}` | Código de identificação na plataforma, se houver. |
| `{{CONFIDENCIAL}}` | Classificação. Trocar a classe do selo se necessário: `cls-publico`, `cls-interno`, `cls-confidencial`, `cls-restrito`. |
| `{{1.0}}` | Versão do documento — não do parceiro. Sobe para 1.1, 1.2... só em retificação pós-assinatura. |

---

## A Formalização (folha 7) — decisão obrigatória

O template mostra **as duas variantes lado a lado** para você decidir. Antes
de enviar ou imprimir a versão final, **apague uma delas**:

**Variante Digital** — mantenha se o parceiro vai aceitar pelo sistema
(clickwrap). Os campos de data/hora, IP, código de verificação e hash são
preenchidos automaticamente pela plataforma no momento do aceite — não
preencha à mão; se este termo for gerado fora do fluxo automatizado, deixe
em branco e adicione manualmente só depois do aceite.

**Variante Física** — mantenha se o documento será impresso e assinado à
mão. Preencha nome do representante legal da BPlen, dados do parceiro, e os
dados de **duas testemunhas** (nome completo + CPF) — exigência padrão para
dar segurança jurídica a um instrumento sem plataforma digital por trás.

Se mantiver a variante física, note a **Cláusula 3.6** (folha 4): o texto
está escrito para aceite eletrônico ("Clickwrap"). Ajuste a redação para
referenciar a assinatura manuscrita nesse cenário — o próprio template já
tem uma nota de uso indicando isso.

Cada folha impressa tem um espaço de **rubrica** no rodapé — relevante só na
via física (assinada à mão); nada a fazer se o meio for digital.

---

## Antes de exportar

- [ ] Nenhum `{{` restante — ative **Ocultar marcações** e confira
- [ ] Decidiu os dois blocos condicionais (comissionamento e vitrine pública)
- [ ] Mantiver **apenas uma** variante de Formalização (Digital ou Física)
- [ ] Se manteve a variante física: ajustou a Cláusula 3.6 e preencheu as
      duas testemunhas
- [ ] CNPJ da BPlen conferido: `62.857.668/0001-07` (não o CNPJ do outro
      contrato do HUB — são entidades diferentes, não confundir)
- [ ] Nenhuma página transbordou (script no `README.md` do kit)
- [ ] PDF exportado com **gráficos de plano de fundo ativados**

---

## O que este template não é

Não substitui revisão jurídica de um caso concreto. Não é o motor de
contrato do HUB (`CONTRACTS-DESIGN.md`) — aquele é código de produto, gated,
com ciclo de vida próprio no Firestore. Este é um instrumento autônomo, para
situações que o sistema automatizado ainda não cobre.
