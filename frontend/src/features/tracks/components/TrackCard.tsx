import { useNavigate, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/InlineEdit";
import { formatRelativeTime } from "@/lib/utils";
import { useUpdateTrack } from "../hooks/useUpdateTrack";
import { useTrackCard } from "../hooks/useTrackCard";
import { useTrackActions } from "../hooks/useTrackActions";
import { TrackActions } from "./TrackActions";
import { TRACK_STATUS_LABEL, TRACK_STATUS_CLASS, type TrackResponse } from "../types";

interface Props {
  track: TrackResponse;
  projectId: string;
  projectName: string;
  canEdit: boolean;
}

export function TrackCard({ track, projectId, projectName, canEdit }: Props) {
  const navigate = useNavigate();
  const updateTrack = useUpdateTrack(projectId, track.id);
  const { isCurrentTrack, isCurrentlyPlaying, canEditContent, versionsLabel } = useTrackCard(
    track,
    canEdit,
  );
  const actions = useTrackActions(projectId, projectName, track);

  const handleNavigate = () => {
    navigate({
      to: "/projects/$projectId/tracks/$trackId",
      params: { projectId, trackId: track.id },
    });
  };

  return (
    <div
      className="bg-surface border border-border rounded-lg p-5 shadow-card cursor-pointer hover:bg-surface-elevated hover:border-border-hover transition-colors"
      onClick={handleNavigate}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <InlineEdit
          value={track.name}
          onSave={canEditContent ? (name) => updateTrack.mutateAsync({ name }) : undefined}
          ariaLabel="Nom de la track"
          className="font-semibold text-foreground text-lg leading-tight"
        />
        <div className="flex items-center gap-2 shrink-0">
          {track.archived && (
            <Badge variant="outline" className="text-sm text-muted-foreground border-border">
              Archivée
            </Badge>
          )}
          <Badge
            variant="outline"
            aria-label={`Statut : ${TRACK_STATUS_LABEL[track.status]}`}
            className={`text-sm ${TRACK_STATUS_CLASS[track.status]}`}
          >
            {TRACK_STATUS_LABEL[track.status]}
          </Badge>
          {/* The card's onClick div is invisible to keyboards — this link is the
              focusable way in. */}
          <Link
            to="/projects/$projectId/tracks/$trackId"
            params={{ projectId, trackId: track.id }}
            aria-label={`Ouvrir ${track.name}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded text-muted-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <InlineEdit
          value={track.description ?? ""}
          onSave={
            canEditContent ? (description) => updateTrack.mutateAsync({ description }) : undefined
          }
          multiline
          ariaLabel="Description de la track"
          className="text-base text-muted-foreground"
          displayClassName="line-clamp-2"
          emptyLabel={canEditContent ? "Ajouter une description" : undefined}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span>{versionsLabel}</span>
        {track.lastVersionNote && (
          <span className="truncate italic">"{track.lastVersionNote}"</span>
        )}
      </div>

      {track.lastComment && (
        <div className="text-sm text-muted-foreground border-t border-border/50 pt-2 mb-3">
          <span className="text-foreground/70">@{track.lastComment.author.username} </span>
          <span className="line-clamp-1">{track.lastComment.content}</span>
          <span className="ml-1 text-muted-foreground/60">
            · {formatRelativeTime(track.lastComment.createdAt)}
          </span>
        </div>
      )}

      <TrackActions
        track={track}
        projectId={projectId}
        canEdit={canEdit}
        canEditContent={canEditContent}
        isCurrentTrack={isCurrentTrack}
        isCurrentlyPlaying={isCurrentlyPlaying}
        actions={actions}
      />
    </div>
  );
}
