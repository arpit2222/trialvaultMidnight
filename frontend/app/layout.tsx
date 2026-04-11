import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { RootProviders } from "@/components/layout/RootProviders";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrialVault",
  description: "ZK-native clinical trials on Midnight Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
