import { Outlet, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border h-20 shrink-0">
        <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold text-xl">
            <span className="text-accent">Music</span>
            <span className="text-foreground"> Workspace</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Register</Link>
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
