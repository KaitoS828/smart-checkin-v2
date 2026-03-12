import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Smart Check-in",
    template: "%s | Smart Check-in",
  },
  description:
    "Secure self-check-in system for unmanned accommodation. Biometric authentication and Secret Code for safe, smooth check-in.",
  keywords: ["check-in", "WebAuthn", "biometric", "self-check-in", "smart lock"],
  openGraph: {
    title: "Smart Check-in",
    description: "Biometric self-check-in system",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
