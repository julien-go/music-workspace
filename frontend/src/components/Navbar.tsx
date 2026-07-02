import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavbarProps = {
  /** Brand / logo element, typically a router Link. */
  brand: ReactNode;
  /** Right-hand nav content shown inline on desktop (≥ 768px). */
  desktopNav: ReactNode;
  /** Nav content stacked vertically inside the mobile drawer (< 768px). */
  mobileNav: ReactNode;
  /** Container max-width utility, matching the surrounding layout. */
  maxWidthClassName?: string;
};

export function Navbar({
  brand,
  desktopNav,
  mobileNav,
  maxWidthClassName = "max-w-[1200px]",
}: NavbarProps) {
  return (
    <>
      {/* WCAG 2.4.1 Bypass Blocks — first focusable element in the DOM, hidden
          until focused, lets keyboard users jump past the nav to the content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-foreground focus:outline focus:outline-2 focus:outline-ring"
      >
        Aller au contenu
      </a>
      <header className="bg-surface border-b border-border h-20 shrink-0">
      <div
        className={cn(
          "mx-auto h-full px-4 md:px-6 flex items-center justify-between",
          maxWidthClassName
        )}
      >
        {brand}

        {/* Desktop nav — hidden below 768px */}
        <nav className="hidden md:flex items-center gap-4">{desktopNav}</nav>

        {/* Mobile nav — hamburger + drawer, hidden at ≥ 768px */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="flex flex-col gap-1 mt-2">{mobileNav}</nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
    </>
  );
}
