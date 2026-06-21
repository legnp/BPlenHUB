import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import CookieConsent from "@/components/shared/CookieConsent";
import GoogleAnalyticsLoader from "@/components/shared/GoogleAnalyticsLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "BPlen | Desenvolvimento Humano",
    template: "BPlen | %s",
  },
  description:
    "Ecossistema para criar, divulgar, vender, conduzir e entregar serviços de Desenvolvimento Humano.",
  icons: {
    icon: "/logo_bplen/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <div id="main-content" className="flex-1 flex flex-col w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
              {children}
            </div>
            {/* Camada Global de Privacidade e Inteligência 🍪📊 */}
            <CookieConsent />
            <GoogleAnalyticsLoader />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
