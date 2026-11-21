"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Mapa", className: "" },
  { href: "/o-nas", label: "O nas", className: "order-last md:order-2" },
];

function getIsActive(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  return href === "/" ? pathname === "/" || pathname.startsWith("/pomysl") : pathname.startsWith(href);
}

export function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV_LINKS.map((link) => {
    const isActive = getIsActive(pathname, link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={isActive ? "page" : undefined}
        className={`${link.className} flex h-10 shrink-0 items-center rounded-full px-3.5 no-underline md:h-11 ${isActive ? "bg-mint text-teal-dark" : "text-ink hover:bg-paper"}`}
      >
        {link.label}
      </Link>
    );
  });
}

export function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}
