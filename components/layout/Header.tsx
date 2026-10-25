import Image from "next/image";
import Link from "next/link";
import { nav, site } from "@/config/site";
import { UserIcon } from "@/components/ui/icons";
import { CartButton } from "./CartButton";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/90 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/75">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-18">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} — home`}>
          <Image
            src="/images/brand/monogram.webp"
            alt=""
            width={70}
            height={48}
            priority
            className="h-10 w-auto md:h-11"
          />
          <span className="leading-none">
            <span className="block font-serif text-[1.35rem] font-semibold tracking-tight">{site.name}</span>
            <span className="mt-1.5 hidden whitespace-nowrap text-[0.62rem] uppercase tracking-[0.24em] text-muted sm:block md:hidden lg:block">
              {site.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-3 py-2 text-[0.95rem] transition-colors hover:bg-cream lg:px-4"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center">
          <Link
            href="/account"
            className="hidden size-11 place-items-center rounded-full hover:bg-cream md:grid"
            aria-label="My account"
          >
            <UserIcon />
          </Link>
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
