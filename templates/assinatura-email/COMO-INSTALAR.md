# Assinatura de E-mail — Como Instalar no Gmail

A assinatura segue o **Padrão de E-mail BPlen V01** (`src/lib/emails/email-layout.ts`):
petróleo `#044159` + ametista, fonte de sistema, logo hospedado em
`bplen.com`. Não é o mesmo padrão visual do site público (aquele usa um
gradiente magenta/roxo — é tratamento de landing page, não de
correspondência) nem do kit de documentos (aquele é serifado, pensado para
impressão em A4).

O Gmail não aceita subir um arquivo `.html` como assinatura. O único jeito
confiável é **abrir o arquivo já pronto no navegador, copiar o conteúdo
renderizado e colar** na caixa de configuração — o Gmail converte
automaticamente para o formato interno dele.

---

## 1. Gerar sua versão

Se seu nome já está em `assinatura-<nome>.html` nesta pasta, pule para o
passo 2. Senão:

1. Duplique `assinatura.template.html` e renomeie para
   `assinatura-seu-nome.html`.
2. Abra o arquivo duplicado num editor de texto e troque cada campo
   `{{ENTRE CHAVES}}`:

   | Campo | Exemplo |
   | --- | --- |
   | `{{NOME}}` | Lisandra Lencina |
   | `{{CARGO}}` | Fundadora / Consultora |
   | `{{EMAIL}}` | lisandra.lencina@bplen.com |
   | `{{TELEFONE}}` | +55 11 94515-2088 |
   | `{{WHATSAPP_LINK}}` | https://wa.me/5511945152088 |
   | `{{LINKEDIN_LINK}}` | https://www.linkedin.com/in/seu-perfil/ |
   | `{{INSTAGRAM_LINK}}` | https://www.instagram.com/seu-usuario |

3. Salve.

## 2. Copiar

1. Abra `assinatura-seu-nome.html` **no navegador** (duplo clique, ou
   arraste para uma aba do Chrome/Edge) — nunca copie direto do editor de
   código, o resultado sai sem formatação.
2. A página mostra um aviso no topo: *"Selecione apenas o conteúdo dentro
   do quadro abaixo e copie"*. Clique um pouco antes do logo, segure e
   arraste até depois do link do Instagram — **só a assinatura**, não a
   página inteira.
3. `Ctrl+C` (ou `Cmd+C` no Mac).

## 3. Colar no Gmail

1. Gmail → ícone de engrenagem (canto superior direito) → **Ver todas as
   configurações**.
2. Aba **Geral** → role até **Assinatura**.
3. **Criar nova** (ou edite a existente) → dê um nome (ex.: "BPlen").
4. Clique dentro da caixa de texto da assinatura e `Ctrl+V`.
5. Confira se o logo e os links vieram junto — o Gmail costuma preservar
   tudo, mas às vezes ajusta o espaçamento. Pequenos ajustes de margem
   podem ser feitos ali mesmo, pela barra de formatação do Gmail.
6. Em **Padrões de assinatura de e-mail**, defina para novos e-mails e
   para respostas/encaminhamentos, conforme sua preferência.
7. Role até o fim da página → **Salvar alterações**.

## 4. Testar antes de usar

Envie um e-mail de teste para outro provedor (um Outlook, um Yahoo, o
celular) antes de considerar pronto. É o único jeito de confirmar que o
logo carrega e o layout não quebra fora do Gmail.

---

## Se precisar ajustar o modelo para todo mundo

Editar `assinatura.template.html` (não as versões já geradas). Regras que
não podem quebrar, porque e-mail não é HTML de site:

- Só tabela com estilo inline (`style="..."` em cada célula). Sem
  `<style>`, sem classe CSS, sem `display:flex` ou `grid`.
- Só fonte de sistema (`Arial, Helvetica, sans-serif`). Fonte customizada
  não carrega em cliente de e-mail — por isso a assinatura não usa a
  serifada do kit de documentos.
- Logo por URL (`https://www.bplen.com/logo_bplen/logo.png`), nunca em
  base64 — vários clientes bloqueiam imagem embutida.
- Sem emoji, conforme a diretriz do projeto.
- Depois de editar, gere de novo as versões de cada pessoa e reenvie o
  passo 2 e 3 para quem já tinha instalado.
