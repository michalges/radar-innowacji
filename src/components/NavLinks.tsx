"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Radar" },
  { href: "/wyzwania", label: "Wyzwania" },
  { href: "/kryteria", label: "Jak oceniamy" },
];

function getIsActive(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  return href === "/" ? pathname === "/" || pathname.startsWith("/karta") : pathname.startsWith(href);
}

export function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV_LINKS.map((link) => {
    const isActive = getIsActive(pathname, link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={isActive ? "page" : undefined}
        className={`rounded-full px-3.5 py-3 no-underline ${isActive ? "bg-mint text-teal-dark" : "text-ink hover:bg-paper"}`}
      >
        {link.label}
      </Link>
    );
  });
}

export function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}
