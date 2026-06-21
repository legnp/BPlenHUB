import React from "react";
import { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { Info, HelpCircle, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de Privacidade",
  description: "Esta Politica de Privacidade explica como o BPlen HUB coleta, usa e protege seus dados.",
};

/**
 * Política de Privacidade Page — BPlen HUB
 * Design: Premium Light, com alta legibilidade e em estrito cumprimento com o Protocolo Zero Emoji.
 */
export default function PrivacidadePage() {
  return (
    <LegalPageShell
      title="Politica de Privacidade"
      subtitle="Como cuidamos, processamos e protegemos as suas informacoes pessoais de acordo com a LGPD."
      lastUpdated="21 de junho de 2026"
      type="privacy"
    >
      <div className="space-y-10 text-[var(--text-secondary)]">
        {/* Intro */}
        <p className="leading-relaxed">
          Na BPlen, nos importamos profundamente com a seguranca e a confidencialidade das suas informacoes. Esta Politica de Privacidade explica como coletamos, usamos, armazenamos, compartilhamos e protegemos os seus dados pessoais ao utilizar o <strong>BPlen HUB</strong>.
        </p>

        {/* Resumo Amigável (Alura style) */}
        <div className="bg-white/80 border-l-4 border-emerald-500 p-6 rounded-r-2xl rounded-l-md shadow-sm space-y-3 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600">
            <Info size={16} />
            <span>Resumo Amigavel (O compromisso BPlen)</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)] font-medium">
            Nos tratamos os seus dados com o maior respeito. Coletamos apenas as informacoes necessarias para operar o HUB, emitir as suas Notas Fiscais e gerar os seus relatorios e avaliacoes de carreira. Nunca venderemos seus dados e nao compartilhamos suas informacoes com terceiros, exceto os parceiros tecnologicos essenciais para que o servico funcione.
          </p>
        </div>

        {/* Seção 1 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            1. Quem e o responsavel pelo tratamento dos seus dados?
          </h2>
          <p className="leading-relaxed">
            A responsavel pelas decisoes referentes ao processamento de dados (Controladora de Dados) e a <strong>LENCINA ESTRATEGIA E GESTAO DE NEGOCIOS E PESSOAS LTDA</strong>, inscrita no CNPJ sob o numero 62.857.668/0001-07, com sede na cidade de <strong>Sao Paulo/SP</strong>.
          </p>
          <p className="leading-relaxed">
            Se voce tiver qualquer duvida sobre como cuidamos dos seus dados, entre em contato atraves do e-mail: <strong className="text-[var(--text-primary)]">contato@bplen.com</strong>.
          </p>
        </section>

        {/* Seção 2 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            2. Quais dados pessoais nos coletamos?
          </h2>
          <p className="leading-relaxed">
            Para fornecer uma experiencia personalizada e cumprir com nossas obrigacoes legais, coletamos os seguintes conjuntos de informacoes:
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Identificacao Basica e Login:</strong> Seu nome completo, endereco de e-mail corporativo ou pessoal, matricula de aluno e foto de perfil (quando voce opta pelo cadastro rapido usando autenticacao externa segura).
            </li>
            <li>
              <strong>Dados Cadastrais e Faturamento (PII):</strong> CPF, data de nascimento, telefone de contato e endereco completo (incluindo Rua, Numero, Bairro, CEP, Cidade e Estado).
            </li>
            <li>
              <strong>Dados Analiticos e de Carreira:</strong> Suas respostas nas pesquisas da plataforma (surveys de perfil comportamental DISC, questionarios de gestao do tempo, objetivos de carreira e checklists de entrega).
            </li>
            <li>
              <strong>Dados de Navegacao (Cookies):</strong> Endereco IP, tipo de navegador, paginas visitadas e tempos de acesso, coletados de forma segura para melhorar o desempenho tecnico do HUB.
            </li>
          </ul>

          {/* Chamada Importante (Alura style) */}
          <div className="bg-white/80 border-l-4 border-amber-500 p-6 rounded-r-2xl rounded-l-md shadow-sm space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600">
              <HelpCircle size={16} />
              <span>Por que solicitamos o CPF e o endereco completo?</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] font-medium">
              O CPF e o endereco sao dados obrigatorios exigidos pela Receita Federal e pela Prefeitura Municipal de Sao Paulo para que possamos emitir a sua Nota Fiscal de Servicos Eletronica (NFS-e) decorrente de sua compra de forma totalmente automatizada.
            </p>
          </div>
        </section>

        {/* Seção 3 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            3. Como usamos as suas informacoes?
          </h2>
          <p className="leading-relaxed">
            Tratamos seus dados com base nas hipoteses legais da LGPD (Lei Geral de Protecao de Dados - Lei 13.709/2018), principalmente para:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li><strong>Execucao do Contrato:</strong> Permitir que voce acesse a plataforma, realize sessoes de mentoria de desenvolvimento e acompanhe sua jornada profissional.</li>
            <li><strong>Geracao de Analises de Carreira:</strong> Processar as suas respostas de pesquisas para gerar relatorios comportamentais ricos (como o mapeamento de competencias e o perfil DISC).</li>
            <li><strong>Faturamento e Fiscal:</strong> Emitir as notas fiscais regulamentares da sua contratacao.</li>
            <li><strong>Comunicacao e Suporte:</strong> Enviar alertas de agendamento, notificacoes de novos checkpoints e dar suporte tecnico quando voce precisar.</li>
            <li><strong>Seguranca da Informacao:</strong> Prevenir fraudes, acessos suspeitos e uso indevido da plataforma.</li>
          </ol>
        </section>

        {/* Seção 4 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            4. Integracoes de Sistemas e Compartilhamento de Dados (Salvaguardas de Seguranca)
          </h2>
          <p className="leading-relaxed">
            Nos nao comercializamos dados pessoais de nossos membros sob nenhuma circunstancia. Para garantir a seguranca dos sistemas contra acessos indevidos e proteger nossa propriedade intelectual, compartilhamos informacoes exclusivamente com prestadores de servicos de padrao internacional, agrupados nas seguintes categorias de parceiros de tecnologia:
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Infraestrutura e Banco de Dados em Nuvem:</strong> Seus dados de login e informacoes de progresso de jornada sao processados de forma criptografada em servidores de banco de dados de alta seguranca operados por provedores globais de infraestrutura em nuvem.
            </li>
            <li>
              <strong>Armazenamento e Sincronizacao Segura de Documentos (Mirroring):</strong> Quando voce preenche seus dados cadastrais ou avaliacoes de progresso, o sistema realiza um espelhamento automatizado e seguro para pastas privadas dedicadas em servicos corporativos de armazenamento em nuvem contratados pela BPlen. Isso gera relatorios em PDF e planilhas de trabalho acessiveis exclusivamente aos mentores autorizados designados para acompanhar a sua jornada.
            </li>
            <li>
              <strong>Meios de Pagamento Integrados:</strong> As suas informacoes de faturamento e dados de cartao de credito sao processados de forma criptografada diretamente no ambiente seguro de nosso parceiro integrador de pagamentos digitais. A BPlen nao armazena nem tem acesso aos dados do seu cartao de credito.
            </li>
          </ul>
        </section>

        {/* Seção 5 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            5. Por quanto tempo armazenamos seus dados?
          </h2>
          <p className="leading-relaxed">
            Mantemos seus dados pessoais armazenados pelo tempo necessario para cumprir com as finalidades descritas nesta politica.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Os dados de perfil comportamental, avaliacoes e progresso de jornada permanecem ativos enquanto sua conta existir, para que voce possa revisitados no futuro.
            </li>
            <li>
              Dados fiscais e de faturamento (como Notas Fiscais e dados de compras) sao guardados pelos prazos legais obrigatorios (geralmente 5 anos, conforme a legislacao tributaria brasileira), mesmo em caso de cancelamento da assinatura.
            </li>
          </ul>
        </section>

        {/* Seção 6 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            6. Seus Direitos sob a LGPD (Artigo 18)
          </h2>
          <p className="leading-relaxed">
            Voce possui controle total sobre suas informacoes. A LGPD garante a voce diversos direitos que podem ser exercidos enviando uma mensagem simples para <strong className="text-[var(--text-primary)]">contato@bplen.com</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-3 pl-2">
            <li>
              <strong>Confirmacao e Acesso:</strong> Saber se tratamos seus dados e solicitar uma copia das informacoes que temos sobre voce.
            </li>
            <li>
              <strong>Correcao:</strong> Solicitar a alteracao de dados incompletos, inexatos ou desatualizados.
            </li>
            <li>
              <strong>Eliminacao:</strong> Requerer a exclusao de dados desnecessarios ou excessivos obtidos mediante consentimento (com excecao daqueles exigidos para cumprimento de obrigacao legal).
            </li>
            <li>
              <strong>Revogacao do Consentimento:</strong> Solicitar a interrupcao do tratamento de determinados dados analiticos baseados em seu consentimento.
            </li>
          </ol>
        </section>

        {/* Seção 7 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            7. Seguranca dos Dados
          </h2>
          <p className="leading-relaxed">
            Adotamos rigidas medidas tecnicas, fisicas e organizacionais para proteger suas informacoes contra perdas, roubos, acessos nao autorizados ou divulgacao acidental. Utilizamos conexoes seguras sob protocolo HTTPS (criptografia TLS), armazenamento seguro em nuvem com controles rigidos de acesso (IAM) e mecanismos constantes de monitoramento de integridade dos bancos de dados.
          </p>

          {/* Dica de Segurança (Alura style) */}
          <div className="bg-white/80 border-l-4 border-rose-500 p-6 rounded-r-2xl rounded-l-md shadow-sm space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-600">
              <ShieldAlert size={16} />
              <span>Navegue com Seguranca</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] font-medium">
              Certifique-se sempre de que voce esta acessando o BPlen HUB pelo dominio oficial e que o icone de cadeado de seguranca esta ativo na barra de navegacao do seu browser. Nos nunca solicitaremos suas senhas pessoais por e-mail ou WhatsApp.
            </p>
          </div>
        </section>
      </div>
    </LegalPageShell>
  );
}
