# Mapa 5 — Design System / Componentes

Status: **completo.** Inventário de `src/components/ui/`, mecanismo de tema,
e todos os componentes de Modal do projeto (13 ao todo), com veredito sobre o
padrão canônico — a pergunta central da Fase 0.

---

## Componentes de `src/components/ui/`

| Componente | Props de variante | Usado em (amostra) | Observação |
|---|---|---|---|
| **GlassModal** | `title?`, `subtitle?`, `maxWidth?`, `className?` | Telas admin (`agenda`, `marketing`, `qrcodes`, `social`, `PostEventWizard`, `ProgramacaoResumo`, `SocialPostForm`) + `FAQContactModal`, `OneToOneBookingModal`, `Calendar`, `UserBookings` | É o modal-base real, mas concentrado em admin — a maioria dos modais de fluxo de usuário não o usa (ver veredito abaixo) |
| **InputGlass** | nenhuma (só `label?`) | `FormsEngine`, `SurveyEngine`, `SurveyFields/*`, `ProfileProfessionalTab`, `ProfileRegistrationTab`, `FAQContactModal`, `PublicBookingFlow` | Átomo consistente, sem duplicação |
| **SelectGlass** | nenhuma (só `label?`) | `FormsEngine`, `SurveyFields/BenefitsPackage`, `ProfileRegistrationTab` | Uso restrito — `Calendar.tsx`/`PublicBookingFlow.tsx` implementam `<select>` estilizado manualmente em vez de reaproveitar |
| **TextareaGlass** | nenhuma (só `label?`) | `FormsEngine`, `SurveyEngine`, vários `SurveyFields/*`, `ProfileProfessionalTab`, `FAQContactModal` | Mesma duplicação: `Calendar.tsx`/`PublicBookingFlow.tsx` usam `<textarea>` cru |
| **CheckboxItem** | `checked` | `FormsEngine`, `SurveyEngine`, `SurveyFields/*` | Escopo restrito a motores de formulário |
| **ChoiceButton** | `active?` | `FormsEngine`, `SurveyEngine`, `SurveyFields/*`, `ProfileRegistrationTab` | — |
| **NavButton** | `variant: "primary"\|"secondary"`, `label?`, `size?`, `disabled?` | `FormsEngine`, `SurveyEngine`, `PublicBookingFlow` | — |
| **TypedText** | nenhuma (`speed`, `className`) | `GuidedTourOverlay` (único consumidor) | **Duplicação funcional com `NarrativeReveal`** — parece legado mantido só para o tour guiado |
| **NarrativeReveal** | `variant: "h2"\|"h3"\|"p"\|"p-muted"`, `speed?`, `delay?`, `active?` | `NarrativeContent`, `SurveyEngine`, `InvitationSurvey` | Componente de revelação narrativa canônico atual (mais completo que `TypedText`: suporta `**negrito**`, `==destaque==`, ícones de status) |
| **Calendar** | sem variante de estilo (recebe dados) | `SurveyEngine`, `StepRenderer`, `AgendaManagementView`, `OneToOneBookingModal` | Usa `GlassModal` internamente, mas `<select>`/`<textarea>` internos são hardcoded |
| **UserBookings** | `compact?: boolean` | `gestao_carreira`, `visao_geral`, `MemberDashboardView`, `StepRenderer`, `AgendaManagementView` | `BookingDetailModal` exportado usa `GlassModal` |
| **PublicBookingFlow** | sem props (estado interno) | `/agendar`, `BookingSection` (home) | Reaproveita `InputGlass`/`NavButton`, mas tem `<select>`/`<textarea>` hardcoded |
| **BusinessCardEngine** | `theme: "light"\|"dark"\|"blue"\|"grey"\|"green"`, `qrTarget`, `visibleFields` | `CvBusinessCardGenerator` (único consumidor) | Tema próprio, paralelo e independente do `ThemeContext` do Hub |
| **ProfessionalProfileView** | sem variante (recebe dados) | `/profissionais/[slug]` (único consumidor) | — |
| **ThemeSelector** | sem props | **Nenhum lugar — zero imports em todo `src/`** | **Componente órfão/morto.** Comentário no próprio código o autodescreve como "Componente de Teste UI". **Não é** o seletor de tema real (esse vive em `HubHeader.tsx`, confirmado usado em todo o hub e admin — ver Mapa 2) |

---

## Mecanismo de Tema (confirmado, não é o `ThemeSelector.tsx` acima)

Vive em `src/components/hub/HubHeader.tsx` — botão de paleta com dropdown de 7
temas (`light, dark, rosa-pitaya, lavanda-azulado, amarelo-sol, cinza-nublado,
daltonico`) via `useTheme()`/`ThemeContext`. `HubHeader` é renderizado
incondicionalmente por `HubShell` (todas as páginas do hub) e reaproveitado
por `AdminLayoutClient` (todas as páginas admin) — confirmado sempre acionável
em toda a área logada, consistente com a exigência do `CLAUDE.md`.

---

## Inventário completo de Modais (13 no total)

| Modal | Usa `GlassModal`? | Padrão real | Aberto por |
|---|---|---|---|
| GlassModal (base) | — | Portal + `motion` + backdrop `bg-white/40 blur-8px` + `rounded-[40px]` | — |
| FAQContactModal | **Sim** | Estende GlassModal | `products/FAQContactModal.tsx` |
| OneToOneBookingModal | **Sim** | Estende GlassModal | `shared/OneToOneBookingModal.tsx` |
| ContractGateModal | Não | Implementação própria, `bg-black/80`, sem portal, `z-[9999]` | `HubShell.tsx` |
| SequenceLockModal | Não (mas **clona visualmente** a receita do GlassModal) | `createPortal` + `motion`, `bg-white/40 blur-8px`, `rounded-[3rem]` | `JourneyNav.tsx`, `SubStepRail.tsx` |
| UpsellServiceModal | Não (mesmo clone visual) | `createPortal` + `motion`, `rounded-[3.5rem]` | `JourneyNav.tsx` |
| WelcomeRedirectModal | Não (usa classe global `glass-modal-open`) | `createPortal` + `motion`, dark `bg-black/85` | `/hub/page.tsx`, `MatriculaGuard.tsx` |
| CouponTermsModal | Não (mesma classe global) | Mesmo padrão dark de `WelcomeRedirectModal` | `CouponInput.tsx` |
| ServiceSelectionModal | Não | `AnimatePresence` sem portal, `bg-[#111]`, `z-[300]` | `FloatingCTAs.tsx` |
| DiscDevolutivaModal | Não | `fixed inset-0 z-[500]`, `bg-black/90`, sem portal | `/admin/users`, `DevolutivaComportamentalView.tsx` |
| ContentEvaluationModal | Não | `fixed inset-0` + `motion`, sem portal | `FeedbackSection.tsx` |
| ThemeSuggestionModal | Não | Mesmo padrão de `ContentEvaluationModal` | `FeedbackSection.tsx` |
| NonMemberOffboardingModal | Não | Função inline (não é arquivo próprio) em `JourneyNav.tsx`, `bg-black/60`, `z-50` | uso interno único |

**Z-index sem coordenação entre grupos**: `50`, `[300]`, `[500]`, `[1000]`,
`[9999]`, `[99999]` — risco real de empilhamento incorreto se dois modais
dispararem ao mesmo tempo (ex.: `ContractGateModal` sobre `UpsellServiceModal`).

---

## Veredito sobre padrão canônico de Modal

**`GlassModal` NÃO é usado como base pela maioria dos modais do projeto.**
Apenas **2 de 13** (`FAQContactModal`, `OneToOneBookingModal`) o importam de
fato. Os outros 11 reimplementam o padrão do zero, cada um com sua própria
receita de `z-index`, cor de backdrop, raio de borda e uso ou não de
`createPortal`. Dentro desses 11, um subgrupo (`SequenceLockModal`,
`UpsellServiceModal`, e a classe `glass-modal-open` de `WelcomeRedirectModal`/
`CouponTermsModal`) **imita visualmente** a receita do GlassModal sem
reaproveitá-lo — convergência de intenção, divergência de implementação, o
pior cenário para manutenção (ajuste no GlassModal não se propaga).

**Implicação direta para `00-PLAN.md` [F0-01]**: a decisão "GlassModal como
base única" ainda não foi implementada na prática, apesar de o componente
existir e estar bem posicionado para isso (props de variante, portal,
fechamento por ESC). Tratar como débito técnico generalizado, não pontual.
