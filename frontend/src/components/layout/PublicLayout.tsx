import { Outlet, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/store/authStore";
import { SessionNavDesktop, SessionNavMobile } from "./SessionNav";
import { GuestNavDesktop, GuestNavMobile } from "./GuestNav";

export function PublicLayout() {
  const user = useAuthStore((s) => s.user);

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
        desktopNav={user ? <SessionNavDesktop /> : <GuestNavDesktop />}
        mobileNav={user ? <SessionNavMobile /> : <GuestNavMobile />}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
    </div>
  );
}
