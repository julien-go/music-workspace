import { Outlet, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";

export function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border h-20 shrink-0">
        <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
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
            {user && (
              <span className="text-base text-muted-foreground">{user.username}</span>
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
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
