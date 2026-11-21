import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Radar Innowacji",
  description: "Pomysły ze szkół, uczelni i urzędów — wyłapane i ocenione przez AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${inter.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-330 flex-1 flex-col gap-8 px-4 py-9 sm:px-8 lg:px-14">{children}</main>
        <footer className="border-t border-line-soft px-4 py-6 text-center text-sm text-muted">Oceny generuje AI według jawnych kryteriów.</footer>
      </body>
    </html>
  );
}
