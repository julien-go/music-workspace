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
  );
}
