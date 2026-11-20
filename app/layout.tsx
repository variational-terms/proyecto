import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Tipografía geométrica para titulares (idéntica a la estética de variational.io)
const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

// Tipografía limpia para cuerpo y UI
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Monoespaciada técnica para cifras, direcciones y badges
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Variational — Genesis Distribution $VAR",
    template: "%s | Variational",
  },
  description:
    "Verifica tu elegibilidad para la Genesis Distribution del token $VAR en Arbitrum One. Sin gas y sin vesting.",
  applicationName: "Variational Protocol",
  keywords: ["Variational", "$VAR", "Arbitrum", "DeFi", "Derivatives", "Genesis Distribution"],
  openGraph: {
    title: "Variational — Genesis Distribution $VAR",
    description:
      "The future of derivatives settles on-chain. Verifica tu elegibilidad para la asignación de $VAR en Arbitrum One.",
    url: "https://variational.io",
    siteName: "Variational",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Variational — Genesis Distribution $VAR",
    description:
      "Verifica tu elegibilidad para la asignación de $VAR en Arbitrum One.",
    creator: "@variational_io",
  },
  icons: {
    icon: "https://www.variational.io/favicon.ico",
    apple: "https://www.variational.io/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#040711",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`dark ${fontHeading.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-[#040711] font-sans text-white antialiased selection:bg-[#4C9AF8]/25 selection:text-[#BFE0FE]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}