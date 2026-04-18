import type { Metadata } from "next";
import { Inter, Bodoni_Moda, Figtree, Jost } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Facepipe | Clinical Analysis",
  description: "Advanced Local Facial Analysis for Clinical Use",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${bodoni.variable} ${figtree.variable} ${jost.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-body selection:bg-primary/30 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
