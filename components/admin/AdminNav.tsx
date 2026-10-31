"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/delivery-zones", label: "Courier rates" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex w-max gap-1.5 pb-1">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors",
                  active ? "bg-chocolate text-ivory" : "bg-paper hover:bg-cream",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
