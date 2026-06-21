import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * BPlen HUB — Proxy de Proteção de Rotas 🛡️
 * Implementa a Soberania de Acesso via servidor para otimizar a performance
 * e garantir que rotas privadas não sejam acessadas por usuários não autenticados.
 * 
 * Nota: O proxy verifica apenas a EXISTÊNCIA do cookie.
 * A validação CRIPTOGRÁFICA ocorre no server-session.ts via verifySessionCookie().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Definir Rotas Protegidas
  const isProtectedPath = pathname.startsWith('/hub') || pathname.startsWith('/admin');

  // 2. Verificar Sessão (Cookie assinado ou legado)
  const hasSignedCookie = request.cookies.has('bplen_session');
  const hasLegacyCookie = request.cookies.has('bplen_session_uid');
  const hasSession = hasSignedCookie || hasLegacyCookie;

  // 3. Lógica de Redirecionamento Autoritário
  if (isProtectedPath && !hasSession) {
    // Redireciona para a home se não estiver autenticado
    // Adicionamos um query param para que a interface possa saber que o acesso foi negado
    const url = new URL('/', request.url);
    url.searchParams.set('auth', 'required');
    url.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Configuração de Matcher
 * Garante que o proxy só rode em requisições de página e não em assets/estáticos.
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
