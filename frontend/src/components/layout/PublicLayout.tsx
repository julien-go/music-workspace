import { Outlet, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SheetClose } from "@/components/ui/sheet";

export function PublicLayout() {
  const brand = (
    <Link to="/" className="font-heading font-bold text-xl">
      <span className="text-accent">Music</span>
      <span className="text-foreground"> Workspace</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        brand={brand}
        maxWidthClassName="max-w-5xl"
        desktopNav={
          <>
            <Button variant="ghost" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Créer un compte</Link>
            </Button>
          </>
        }
        mobileNav={
          <>
            <SheetClose asChild>
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/login">Connexion</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild className="justify-start">
                <Link to="/register">Créer un compte</Link>
              </Button>
            </SheetClose>
          </>
        }
      />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
    </div>
  );
}
