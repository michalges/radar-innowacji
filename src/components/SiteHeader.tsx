import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/LogoMark";
import { ActiveNavLinks, NavLinks } from "@/components/NavLinks";

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b md:gap-x-1 border-line-soft px-4 py-2.5 sm:px-8 lg:px-14">
      <Link href="/" className="flex items-center gap-1.5 font-display text-lg sm:gap-2 sm:text-xl font-extrabold tracking-tight text-ink no-underline md:mr-auto">
        <LogoMark className="size-6 sm:size-7" />
        <span>
          radar<span className="text-teal">innowacji</span>
        </span>
      </Link>
      <Link
        href="/zglos"
        className="flex h-9 items-center rounded-full bg-teal px-3.5 text-sm font-semibold text-white no-underline shadow-[0_4px_12px_rgba(10,97,120,0.25)] hover:bg-teal-dark md:order-1 md:ml-1 md:px-4"
      >
        Zgłoś pomysł
      </Link>
      <nav
        aria-label="Menu"
        className="-mx-4 flex basis-full items-center gap-1 overflow-x-auto px-4 text-sm font-medium [scrollbar-width:none] md:contents"
      >
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
        <Link
          href="/wyzwania"
          className="ml-1 flex h-9 shrink-0 items-center rounded-full border border-teal px-3.5 font-semibold whitespace-nowrap text-teal-dark no-underline hover:bg-mint md:px-4"
        >
          Znajdź rozwiązanie
        </Link>
      </nav>
    </header>
  );
}
