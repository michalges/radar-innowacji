import Link from "next/link";
import { Suspense } from "react";
import { ActiveNavLinks, NavLinks } from "@/components/NavLinks";

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b md:gap-x-1 border-line-soft px-4 py-3 sm:px-8 lg:px-14">
      <Link href="/" className="font-display text-[22px] md:mr-auto font-extrabold tracking-tight text-ink no-underline">
        radar<span className="text-teal">●</span>innowacji
      </Link>
      <Link
        href="/zglos"
        className="flex h-10 items-center rounded-full bg-teal px-4 text-sm font-semibold text-white no-underline shadow-[0_6px_18px_rgba(14,116,124,0.3)] hover:bg-teal-dark md:order-1 md:ml-1 md:h-11 md:px-5 md:text-[15px]"
      >
        Zgłoś pomysł
      </Link>
      <nav
        aria-label="Menu"
        className="-mx-4 flex basis-full items-center gap-1 overflow-x-auto px-4 text-[15px] font-medium [scrollbar-width:none] md:contents"
      >
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
        <Link
          href="/wyzwania"
          className="ml-1 flex h-10 shrink-0 items-center rounded-full border-2 border-teal px-4 font-semibold whitespace-nowrap text-teal-dark no-underline hover:bg-mint md:h-11 md:px-5"
        >
          Znajdź rozwiązanie
        </Link>
      </nav>
    </header>
  );
}
