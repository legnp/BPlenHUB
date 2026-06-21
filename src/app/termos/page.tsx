import React from "react";
import { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { Info, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Estes Termos de Uso regem a sua relacao com o BPlen HUB. Leia com atencao.",
};

/**
 * Termos de Uso Page — BPlen HUB
 * Design: Premium Light, com alta legibilidade e em estrito cumprimento com o Protocolo Zero Emoji.
 */
export default function TermosPage() {
  return (
    <LegalPageShell
      title="Termos de Uso"
      subtitle="Regras, diretrizes e condicoes de uso do nosso ecossistema de desenvolvimento profissional."
      lastUpdated="21 de junho de 2026"
      type="terms"
    >
      <div className="space-y-10 text-[var(--text-secondary)]">
        {/* Intro */}
        <p className="text-base leading-relaxed font-medium text-[var(--text-primary)]">
          Seja muito bem-vindo(a) ao <strong>BPlen HUB</strong>!
        </p>
        <p className="leading-relaxed">
          Estes Termos de Uso regem a sua relacao com a nossa plataforma. Ao acessar o HUB, voce concorda com estas regras. Por favor, leia com atencao.
        </p>

        {/* Resumo Amigavel (Alura style) */}
        <div className="bg-white/80 border-l-4 border-[#ff0080] p-6 rounded-r-2xl rounded-l-md shadow-sm space-y-3 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#ff0080]">
            <Info size={16} />
            <span>Resumo Amigavel (O que e este documento?)</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)] font-medium">
            Este e o nosso contrato de convivencia. Ele estabelece de forma clara o que nos oferecemos a voce, quais sao os seus deveres como membro e as responsabilidades mutuas para mantermos uma comunidade produtiva, segura e focada no seu desenvolvimento de carreira.
          </p>
        </div>

        {/* Seção 1 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            1. O que e o BPlen HUB?
          </h2>
          <p className="leading-relaxed">
            O <strong>BPlen HUB</strong> e um ecossistema de desenvolvimento profissional e humano de alta performance. Nos oferecemos um conjunto integrado de servicos, que incluem:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Acesso a uma plataforma digital de acompanhamento de carreira;</li>
            <li>Ferramentas de assessments comportamentais e analises tecnicas (como o mapeamento de perfil DISC e analises de gestao de tempo);</li>
            <li>Sessoes de mentoria de desenvolvimento de carreira e encontros com especialistas;</li>
            <li>Conteudos exclusivos, trilhas de aprendizagem e materiais de apoio;</li>
            <li>Ambientes de interacao e comunidade profissional.</li>
          </ul>
        </section>

        {/* Seção 2 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            2. Sua Conta, Acesso e Seguranca
          </h2>
          <p className="leading-relaxed">
            Para fazer parte do BPlen HUB, voce precisara de uma conta de acesso ativa:
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Uso Pessoal e Intransferivel:</strong> O seu login e de uso estritamente pessoal. E terminantemente proibido compartilhar suas credenciais de acesso, transferir sua conta para terceiros ou permitir que outras pessoas utilizem sua trilha de desenvolvimento.
            </li>
            <li>
              <strong>Veracidade dos Dados:</strong> Voce se compromete a fornecer dados cadastrais (como CPF, nome completo e faturamento) autenticos e atualizados. A consistencia dessas informacoes e essencial para fins de faturamento fiscal e conformidade cadastral.
            </li>
            <li>
              <strong>Bloqueio e Seguranca:</strong> Caso identifiquemos acessos simultaneos de diferentes localizacoes ou indicios de compartilhamento de credenciais, a BPlen reserva-se o direito de suspender a conta preventivamente para seguranca dos seus dados.
            </li>
          </ul>

          {/* Dica Amigavel (Alura style) */}
          <div className="bg-white/80 border-l-4 border-emerald-500 p-6 rounded-r-2xl rounded-l-md shadow-sm space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600">
              <Lightbulb size={16} />
              <span>Por que o acesso e individual?</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] font-medium">
              A sua jornada no HUB e personalizada para o seu perfil e carreira. Compartilhar o seu acesso distorce as suas analises, compromete seus relatorios de evolucao e prejudica a integridade das suas avaliacoes comportamentais.
            </p>
          </div>
        </section>

        {/* Seção 3 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            3. Propriedade Intelectual e Codigo de Conduta
          </h2>
          <p className="leading-relaxed">
            Todo o material disponibilizado no BPlen HUB — incluindo videos, apostilas, planilhas de evolucao, metodologias proprietarias, designs de tela, estruturas do software e as ferramentas de jornada (como o <em>JourneyMap</em>) — e de propriedade intelectual exclusiva da <strong>BPlen</strong> ou licenciado a ela.
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>O que voce PODE fazer:</strong> Assistir aos conteudos, responder aos assessments, baixar os relatorios gerados especificamente para voce, e aplicar as metodologias no seu desenvolvimento individual ou na gestao de suas proprias equipes.
            </li>
            <li>
              <strong>O que voce NAO PODE fazer:</strong> Copiar, reproduzir, republicar, vender, alugar ou distribuir comercialmente qualquer trecho, video, imagem ou metodologia da BPlen sem o nosso consentimento previo e formal por escrito.
            </li>
            <li>
              <strong>Codigo de Conduta da Comunidade:</strong> Nossos espacos de interacao exigem respeito profissional absoluto. Nao toleramos comportamentos de assedio, discriminacao, discursos de odio, spam comercial, ou qualquer atitude que prejudique o ambiente de aprendizado dos demais membros.
            </li>
          </ul>
        </section>

        {/* Seção 4 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            4. Funcionamento da Jornada e Bloqueio de Etapas (Sequence Lock)
          </h2>
          <p className="leading-relaxed">
            Para garantir que voce obtenha o maximo aproveitamento do seu processo de desenvolvimento, a plataforma adota uma metodologia estruturada:
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Progressao Linear:</strong> A liberacao dos servicos, formularios, pesquisas e novos conteudos segue uma ordem cronologica planejada.
            </li>
            <li>
              <strong>Trava de Sequencia (Sequence Lock):</strong> Voce so podera avancar para uma nova etapa da jornada de desenvolvimento (ou agendar novos servicos especificos) apos a conclusao e preenchimento dos checkpoints anteriores (como pesquisas de perfil, desafios praticos e assessments obrigatorios). Esse metodo garante que seu mentor de desenvolvimento tenha as informacoes necessarias para as sessoes presenciais ou sincronas.
            </li>
          </ul>
        </section>

        {/* Seção 5 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            5. Natureza das Avaliacoes e Assessments (Limitacao de Responsabilidade)
          </h2>
          <p className="leading-relaxed">
            As avaliacoes e relatorios do BPlen HUB (como os perfis de personalidade, analises comportamentais e assessments de competencias) sao ferramentas analiticas de orientacao de desenvolvimento humano.
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Direcionamentos Consultivos:</strong> Os relatorios expressam tendencias, inclinacoes e percepcoes de carreira. Eles nao constituem promessas absolutas, garantias contratuais de contratacao, promocoes de emprego automaticas ou resultados financeiros pre-definidos.
            </li>
            <li>
              <strong>Protagonismo do Aluno:</strong> O sucesso de sua carreira depende da aplicacao pratica e continua dos insights adquiridos no HUB. A BPlen fornece os instrumentos e a mentoria de desenvolvimento, mas a execucao das acoes de desenvolvimento e de sua exclusiva responsabilidade.
            </li>
          </ul>
        </section>

        {/* Seção 6 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            6. Pagamentos, Renovacao e Cancelamento
          </h2>
          <p className="leading-relaxed">
            As condicoes financeiras e de faturamento seguem as diretrizes abaixo:
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2">
            <li>
              <strong>Processamento de Pagamento:</strong> Nossas vendas e parcelamentos sao integrados e processados de forma segura por intermediadores de pagamento especializados de padrao internacional.
            </li>
            <li>
              <strong>Politicas de Reembolso:</strong> Voce tem o direito de arrependimento assegurado por lei, podendo solicitar o cancelamento e reembolso integral em ate 7 (sete) dias corridos a contar da confirmacao de compra, diretamente pelos nossos canais de atendimento.
            </li>
            <li>
              <strong>Regras apos o prazo de reflexao:</strong> Apos o prazo legal de 7 dias, as condicoes de encerramento contratual e multas aplicaveis seguirao as clausulas especificas do plano ou pacote de servicos contratado no momento da matricula.
            </li>
          </ul>
        </section>

        {/* Seção 7 */}
        <section className="space-y-4 font-medium">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            7. Modificacoes e Solucao de Controversias
          </h2>
          <p className="leading-relaxed font-normal">
            Reservamo-nos o direito de atualizar estes Termos de Uso periodicamente para refletir novas funcionalidades da plataforma ou ajustes juridicos. Quando fizermos alteracoes relevantes, voce sera notificado dentro da plataforma.
          </p>
          <ul className="list-disc list-inside space-y-3 pl-2 font-normal">
            <li>Estes Termos sao regidos pelas leis da Republica Federativa do Brasil.</li>
            <li>
              Qualquer controversia decorrente destes termos sera resolvida preferencialmente de forma amigavel e extrajudicial atraves de nossos canais de atendimento. Caso nao seja possivel, fica eleito o Foro da Comarca de <strong>Sao Paulo/SP</strong> para a resolucao definitiva de conflitos decorrentes deste instrumento.
            </li>
          </ul>
        </section>
      </div>
    </LegalPageShell>
  );
}
