import { Outlet, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { PersistentPlayer } from "@/components/PersistentPlayer";

export function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border h-20 shrink-0">
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/dashboard" className="font-heading font-bold text-xl">
            <span className="text-accent">Music</span>
            <span className="text-foreground"> Workspace</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-base text-foreground hover:text-accent transition-colors"
            >
              Dashboard
            </Link>
            <Separator orientation="vertical" className="h-5" />
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-base text-muted-foreground">{user.username}</span>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <PersistentPlayer />
    </div>
  );
}
