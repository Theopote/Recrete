import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Recrete — 砼憶 | AI Copilot for Existing Building Renovation",
  description: "面向既有建筑更新的 AI 设计助手。Reimagine. Renew. Recreate. AI agent that reads, understands, diagnoses, and manages building renovation projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
