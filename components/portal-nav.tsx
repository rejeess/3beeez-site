"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/knowledge", label: "Knowledge Base" },
  { href: "/portal/conversations", label: "Chat History" },
];

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="portal-nav">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`portal-nav-link${pathname === href ? " portal-nav-link-active" : ""}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
