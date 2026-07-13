import { Outlet, Link } from "@tanstack/react-router";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { Navbar } from "@/components/Navbar";
import { SessionNavDesktop, SessionNavMobile } from "./SessionNav";

export function AuthLayout() {
  const brand = (
    <Link to="/dashboard" className="font-heading font-bold text-xl">
      <span className="text-accent">Music</span>
      <span className="text-foreground"> Workspace</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        brand={brand}
        desktopNav={<SessionNavDesktop />}
        mobileNav={<SessionNavMobile />}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-28 outline-none">
        <Outlet />
      </main>
      <PersistentPlayer />
    </div>
  );
}
