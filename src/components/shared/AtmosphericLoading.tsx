/**
 * Loader único das telas do hub. Texto padrão: "Carregando {nome da página}"
 * (regra global do CLAUDE.md) — passe via `label`.
 */
export default function AtmosphericLoading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="min-h-[400px] flex-1 flex flex-col items-center justify-center p-12">
      <div className="w-10 h-10 border-4 border-t-[var(--accent-start)] border-[var(--accent-soft)] rounded-full animate-spin" />
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">
        {label}
      </p>
    </div>
  );
}
