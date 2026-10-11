import type { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/constants";
import { Providers } from "@/components/providers/session-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import AIAssistant from "@/components/ai-assistant";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} - ตลาดสินค้าเกษตรออนไลน์`,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <link rel="icon" href="/logo.jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground overflow-x-hidden">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <AIAssistant />
        </Providers>
      </body>
    </html>
  );
}
