import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Radar Innowacji",
  description: "Wyłapujemy innowacje ze szkół, uczelni i urzędów i łączymy je z tymi, którzy mogą je wdrożyć.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${inter.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-330 flex-1 flex-col gap-8 px-4 py-9 sm:px-8 lg:px-14">{children}</main>
        <footer className="border-t border-line-soft px-4 py-6 text-center text-sm text-muted">
          Radar Innowacji · oceny generuje AI na podstawie jawnych kryteriów — każdą kartę możesz zgłosić jako błędną.
        </footer>
      </body>
    </html>
  );
}
