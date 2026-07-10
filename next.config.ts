import type { NextConfig } from "next";

/**
 * BPlen HUB — Next.js Configuration (Governança 🛡️)
 * Segurança, otimização de imagens e headers HTTP.
 */
const nextConfig: NextConfig = {

  // ──────────────────────────────
  // 0.0 File tracing — inclui os arquivos de métrica de fonte do pdfkit (.afm) no
  //     bundle das funções serverless. Sem isto, a geração de PDF do contrato falha
  //     em produção com ENOENT em pdfkit/js/data/Helvetica.afm (o Next não rastreia
  //     esses assets de node_modules automaticamente). Custo mínimo (arquivos pequenos).
  // ──────────────────────────────
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/**/*.afm"],
  },

  // ──────────────────────────────
  // 0. Configurações Experimentais (Limite de Upload de Server Actions)
  // ──────────────────────────────
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Aumenta o limite padrão de 1MB para suportar anexos de pós-evento de até 5MB
    },
  },

  // ──────────────────────────────
  // 1. Otimização de Imagens (Domínios Autorizados)
  // ──────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleapis.com",
      },
    ],
  },

  // ──────────────────────────────
  // 2. Firebase Auth Proxied Rewrites (Soberania de Domínio 🔑)
  // Evita o erro 404 de popup ao usar bplen.com como authDomain
  // ──────────────────────────────
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://bplenhub.firebaseapp.com/__/auth/:path*",
      },
      {
        source: "/__/firebase/:path*",
        destination: "https://bplenhub.firebaseapp.com/__/firebase/:path*",
      },
    ];
  },

  // ──────────────────────────────
  // 3. Security Headers (OWASP Compliance 🛡️)
  // ──────────────────────────────
  async headers() {
    return [
      {
        // Aplicar a todas as rotas
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
