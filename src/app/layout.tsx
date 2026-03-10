import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Knowledge Retention",
  description: "A spaced-repetition application for university students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background antialiased text-foreground`} suppressHydrationWarning>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Navigation />
          <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
            {children}
          </main>
        </div>
        <Script
          src="https://tikzjax.com/v1/tikzjax.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
