import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { IgnoreExtensionErrors } from "@/components/dev/ignore-extension-errors";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/layout/page-transition";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChilizBurn",
  description: "Real-time transparency for CHZ burns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {process.env.NODE_ENV === "development" ? <IgnoreExtensionErrors /> : null}
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:py-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
