import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildEntrarPath } from '@/lib/auth/identity-guards';

/**
 * BPlen HUB — Proxy de Protecao de Rotas
 * Soberania de acesso via servidor: rotas privadas nao sao servidas a usuarios
 * sem sessao. O proxy verifica apenas a EXISTENCIA do cookie; a validacao
 * CRIPTOGRAFICA ocorre no server-session.ts via verifySessionCookie().
 *
 * Retorno a origem unificado (secao 6 do plano): sessao ausente numa rota
 * protegida redireciona para a superficie canonica de login preservando o destino
 * (`/entrar?returnTo=<rota>`), com `returnTo` sanitizado (anti open-redirect).
 * Alem disso expoe o caminho atual no header `x-bplen-pathname` para os layouts
 * protegidos montarem o mesmo redirecionamento no fallback de sessao stale.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Definir Rotas Protegidas
  const isProtectedPath = pathname.startsWith('/hub') || pathname.startsWith('/admin');

  // 2. Verificar Sessao (cookie assinado ou legado)
  const hasSignedCookie = request.cookies.has('bplen_session');
  const hasLegacyCookie = request.cookies.has('bplen_session_uid');
  const hasSession = hasSignedCookie || hasLegacyCookie;

  // 3. Redirecionamento autoritario para a superficie canonica de login,
  //    preservando a origem de forma segura.
  if (isProtectedPath && !hasSession) {
    const url = new URL(buildEntrarPath(pathname), request.url);
    return NextResponse.redirect(url);
  }

  // 4. Expor o caminho atual para os layouts (fallback de sessao stale).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-bplen-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Configuracao de Matcher
 * Garante que o proxy so rode em requisicoes de pagina e nao em assets/estaticos.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
