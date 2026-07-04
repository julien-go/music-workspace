import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "@/components/InlineEdit";
import { formatRelativeTime } from "@/lib/utils";
import type { useUpdateTrackVersion } from "../hooks/useUpdateTrackVersion";
import type { TrackVersionResponse } from "../types";

function playLabel(isCurrentlyPlaying: boolean, isCurrentVersion: boolean) {
  if (isCurrentlyPlaying) return "⏸ En lecture";
  if (isCurrentVersion) return "▶ Reprendre";
  return "▶ Écouter";
}

function VersionName({
  version,
  canEdit,
  title,
  fallbackName,
  updateVersion,
}: {
  version: TrackVersionResponse;
  canEdit: boolean;
  title: string | null;
  fallbackName: string | null;
  updateVersion: ReturnType<typeof useUpdateTrackVersion>;
}) {
  if (canEdit) {
    return (
      <div className="min-w-0 flex-1">
        <InlineEdit
          value={version.label ?? ""}
          onSave={(label) => updateVersion.mutateAsync({ label })}
          ariaLabel={`Nom de la version ${version.versionNumber}`}
          className="text-base font-medium text-foreground"
          emptyLabel={fallbackName ?? "Nommer cette version"}
        />
      </div>
    );
  }
  return title ? (
    <span className="text-base font-medium text-foreground truncate">{title}</span>
  ) : null;
}

export function VersionCardHeader({
  version,
  canEdit,
  title,
  fallbackName,
  fileExtension,
  updateVersion,
  trackName,
  isCurrentVersion,
  isCurrentlyPlaying,
  onPlay,
}: {
  version: TrackVersionResponse;
  canEdit: boolean;
  title: string | null;
  fallbackName: string | null;
  fileExtension: string | null;
  updateVersion: ReturnType<typeof useUpdateTrackVersion>;
  trackName: string;
  isCurrentVersion: boolean;
  isCurrentlyPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 mb-3 md:flex-row md:items-start md:justify-between md:gap-4">
      <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
        <Badge
          variant="outline"
          className="text-accent border-accent/40 font-mono text-base font-bold px-3 py-1 shrink-0"
        >
          v{version.versionNumber}
        </Badge>
        <VersionName
          version={version}
          canEdit={canEdit}
          title={title}
          fallbackName={fallbackName}
          updateVersion={updateVersion}
        />
        {fileExtension && (
          <Badge
            variant="outline"
            className="text-muted-foreground border-border font-mono text-xs shrink-0"
          >
            {fileExtension}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground shrink-0">
          {formatRelativeTime(version.createdAt)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPlay}
        aria-label={
          isCurrentlyPlaying
            ? `Mettre en pause ${trackName} v${version.versionNumber}`
            : `Écouter ${trackName} v${version.versionNumber}`
        }
        className={`text-sm h-8 px-3 shrink-0 ${isCurrentlyPlaying ? "text-accent" : ""}`}
      >
        {playLabel(isCurrentlyPlaying, isCurrentVersion)}
      </Button>
    </div>
  );
}
