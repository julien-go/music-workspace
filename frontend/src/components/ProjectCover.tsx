import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface Props {
  name: string;
  coverUrl: string | null;
  className?: string;
}

/** Project thumbnail: the cover image, or an initials/Music-icon fallback. */
export function ProjectCover({ name, coverUrl, className }: Props) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={name}
        className={cn("w-32 h-32 object-cover rounded-lg", className)}
      />
    );
  }

  const initials = initialsOf(name);
  return (
    <div
      className={cn(
        "w-32 h-32 rounded-lg bg-surface border border-border flex items-center justify-center",
        className,
      )}
    >
      {initials ? (
        <span className="text-2xl font-semibold text-muted-foreground">
          {initials}
        </span>
      ) : (
        <Music className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
