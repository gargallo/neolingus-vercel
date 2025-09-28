import type { Metadata } from "next";
import "./globals.css";
import "../styles/dashboard-layouts.css";
import Header from "@/components/header";
import DemoModeBanner from "@/components/demo-mode-banner";
import { Inter } from "next/font/google";
import { EnhancedThemeProvider } from "@/components/providers/enhanced-theme-provider";
import { ExamStateProvider } from "@/components/providers/exam-state-provider";

const inter = Inter({ subsets: ["latin"] });

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Update Starter Kit",
  description: "The fastest way to build apps with Next.js and Update",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <EnhancedThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="neolingus-theme"
        >
          <ExamStateProvider>
            <DemoModeBanner />
            <Header />
            {children}
          </ExamStateProvider>
        </EnhancedThemeProvider>
      </body>
    </html>
  );
}
