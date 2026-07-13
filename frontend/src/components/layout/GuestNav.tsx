import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";

export function GuestNavDesktop() {
  return (
    <>
      <Button variant="ghost" asChild>
        <Link to="/login">Connexion</Link>
      </Button>
      <Button asChild>
        <Link to="/register">Créer un compte</Link>
      </Button>
    </>
  );
}

export function GuestNavMobile() {
  return (
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
  );
}
