import { Outlet, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { Navbar } from "@/components/Navbar";
import { SheetClose } from "@/components/ui/sheet";

export function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const brand = (
    <Link to="/dashboard" className="font-heading font-bold text-xl">
      <span className="text-accent">Music</span>
      <span className="text-foreground"> Workspace</span>
    </Link>
  );

  const userBadge = user && (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-muted-foreground">
          {user.username.charAt(0).toUpperCase()}
        </span>
      </div>
      <span className="text-base text-muted-foreground">{user.username}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        brand={brand}
        desktopNav={
          <>
            <Link
              to="/dashboard"
              className="text-base text-foreground hover:text-accent transition-colors"
            >
              Dashboard
            </Link>
            <Separator orientation="vertical" className="h-5" />
            {userBadge}
            <Button
              variant="ghost"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Logout
            </Button>
          </>
        }
        mobileNav={
          <>
            {userBadge && <div className="pb-2">{userBadge}</div>}
            <Separator className="mb-1" />
            <SheetClose asChild>
              <Link
                to="/dashboard"
                className="text-base text-foreground hover:text-accent transition-colors py-2"
              >
                Dashboard
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="justify-start mt-1"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                Logout
              </Button>
            </SheetClose>
          </>
        }
      />
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <PersistentPlayer />
    </div>
  );
}
