import { useRouter } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { type ProjectResponse, ROLE_LABEL, ROLE_CLASS } from "../types";

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function CoverAvatar({ name, coverUrl }: { name: string; coverUrl: string | null }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={name}
        className="w-12 h-12 rounded-md object-cover shrink-0"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-md bg-surface-elevated border border-border flex items-center justify-center shrink-0">
      {initials ? (
        <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
      ) : (
        <Music className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
  );
}

export function ProjectCard({ project }: { project: ProjectResponse }) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.navigate({ to: "/projects/$projectId", params: { projectId: project.id } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
        }
      }}
      className="flex items-center gap-4 px-5 py-4 bg-surface border border-border rounded-card hover:bg-surface-elevated transition-colors duration-150 cursor-pointer"
    >
      <CoverAvatar name={project.name} coverUrl={project.coverUrl} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{project.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">par {project.owner.username}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0 text-right">
        <span
          className={`text-xs border rounded px-2 py-0.5 ${ROLE_CLASS[project.currentUserRole]}`}
        >
          {ROLE_LABEL[project.currentUserRole]}
        </span>
        <span className="text-xs text-muted-foreground hidden md:block w-24 text-right">
          {formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}
