import Link from "next/link";
import { cn } from "@/lib/format";
import type { Category } from "@/lib/types";

export function CategoryChips({ categories, active }: { categories: Category[]; active?: string }) {
  const items = [{ slug: "", name: "All" }, ...categories];
  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 pb-1">
        {items.map((c) => {
          const href = "is_enquiry_only" in c && c.is_enquiry_only ? "/corporate" : c.slug ? `/shop/${c.slug}` : "/shop";
          const isActive = (active ?? "") === c.slug;
          return (
            <li key={c.slug || "all"}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors",
                  isActive ? "border-chocolate bg-chocolate text-ivory" : "border-line bg-paper hover:border-chocolate/60",
                )}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
