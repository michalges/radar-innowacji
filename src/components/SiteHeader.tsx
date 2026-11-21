import Link from "next/link";
import { Suspense } from "react";
import { ActiveNavLinks, NavLinks } from "@/components/NavLinks";

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-4 sm:px-8 lg:px-14">
      <Link href="/" className="font-display text-[22px] font-extrabold tracking-tight text-ink no-underline">
        radar<span className="text-teal">●</span>innowacji
      </Link>
      <nav aria-label="Menu" className="flex flex-wrap items-center gap-1 text-[15px] font-medium">
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
        <Link href="/zglos" className="rounded-full bg-ink px-4.5 py-3 text-white no-underline hover:bg-ink-soft">
          Zgłoś
        </Link>
      </nav>
    </header>
  );
}
