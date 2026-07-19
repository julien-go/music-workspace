import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SheetClose } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";

function UserBadge({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-muted-foreground">
          {username.charAt(0).toUpperCase()}
        </span>
      </div>
      <span className="text-base text-muted-foreground">{username}</span>
    </div>
  );
}

export function SessionNavDesktop() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  if (!user) return null;
  return (
    <>
      <Link
        to="/dashboard"
        className="text-base text-foreground hover:text-accent transition-colors"
      >
        Dashboard
      </Link>
      <Separator orientation="vertical" className="h-5" />
      <UserBadge username={user.username} />
      <Button variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
        Logout
      </Button>
    </>
  );
}

export function SessionNavMobile() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  if (!user) return null;
  return (
    <>
      <div className="pb-2">
        <UserBadge username={user.username} />
      </div>
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
  );
}
