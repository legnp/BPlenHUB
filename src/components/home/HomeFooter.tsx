import { GlobalFooter } from "@/components/layout/GlobalFooter";

/**
 * HomeFooter (Rodapé da Landing Page)
 * Agora utiliza o padrão GlobalFooter para consistência em todo o ecossistema.
 */
export function HomeFooter() {
  return <GlobalFooter variant="full" />;
}
