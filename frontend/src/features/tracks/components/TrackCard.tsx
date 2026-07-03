import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "@/components/InlineEdit";
import { usePlayerStore } from "@/store/playerStore";
import { useQueryClient } from "@tanstack/react-query";
import { getTrackVersions } from "../api";
import { useArchiveTrack } from "../hooks/useArchiveTrack";
import { useUnarchiveTrack } from "../hooks/useUnarchiveTrack";
import { useUpdateTrack } from "../hooks/useUpdateTrack";
import { AddVersionDialog } from "./AddVersionDialog";
import { formatRelativeTime } from "@/lib/utils";
import { toastError } from "@/lib/toast";
import { isUnauthorizedError, describeError } from "@/lib/api";
import type { TrackResponse } from "../types";

interface Props {
  track: TrackResponse;
  projectId: string;
  projectName: string;
  canEdit: boolean;
}

const statusLabel: Record<string, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

const statusClass: Record<string, string> = {
  DRAFT: "bg-muted/50 text-muted-foreground border-border",
  IN_PROGRESS: "bg-amber-400/10 text-amber-400 border-amber-400/25",
  DONE: "bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
};

export function TrackCard({ track, projectId, projectName, canEdit }: Props) {
  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isCurrentTrack = current?.trackId === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const queryClient = useQueryClient();

  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [addVersionOpen, setAddVersionOpen] = useState(false);
  const archiveTrack = useArchiveTrack(projectId);
  const unarchiveTrack = useUnarchiveTrack(projectId);
  const updateTrack = useUpdateTrack(projectId, track.id);

  const handleNavigate = () => {
    navigate({
      to: "/projects/$projectId/tracks/$trackId",
      params: { projectId, trackId: track.id },
    });
  };

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.versionCount === 0 || isLoadingPlay) return;
    if (isCurrentTrack) {
      if (isPlaying) pause();
      else resume();
      return;
    }
    setIsLoadingPlay(true);
    try {
      const versions = await queryClient.fetchQuery({
        queryKey: ["trackVersions", projectId, track.id],
        queryFn: () => getTrackVersions(projectId, track.id),
      });
      const latest = versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
      if (latest) {
        play({
          projectId,
          projectName,
          trackId: track.id,
          trackName: track.name,
          versionId: latest.id,
          versionNumber: latest.versionNumber,
          audioUrl: latest.audioUrl,
          notes: latest.notes,
          label: latest.label,
          originalFileName: latest.originalFileName,
        });
      }
    } catch {
      setPlayError(true);
    } finally {
      setIsLoadingPlay(false);
    }
  };

  return (
    <div
      className="bg-surface border border-border rounded-lg p-5 shadow-card cursor-pointer hover:bg-surface-elevated hover:border-border-hover transition-colors"
      onClick={handleNavigate}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <InlineEdit
          value={track.name}
          onSave={canEdit ? (name) => updateTrack.mutateAsync({ name }) : undefined}
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
            aria-label={`Statut : ${statusLabel[track.status]}`}
            className={`text-sm ${statusClass[track.status]}`}
          >
            {statusLabel[track.status]}
          </Badge>
          <ChevronRight className="w-5 h-5 text-muted-foreground/40" aria-hidden="true" />
        </div>
      </div>

      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <InlineEdit
          value={track.description ?? ""}
          onSave={canEdit ? (description) => updateTrack.mutateAsync({ description }) : undefined}
          multiline
          ariaLabel="Description de la track"
          className="text-base text-muted-foreground"
          displayClassName="line-clamp-2"
          emptyLabel={canEdit ? "Ajouter une description" : undefined}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span>{track.versionCount} version{track.versionCount !== 1 ? "s" : ""}</span>
        {track.lastVersionNote && (
          <span className="truncate italic">"{track.lastVersionNote}"</span>
        )}
      </div>

      {track.lastComment && (
        <div className="text-sm text-muted-foreground border-t border-border/50 pt-2 mb-3">
          <span className="text-foreground/70">@{track.lastComment.author.username} </span>
          <span className="line-clamp-1">{track.lastComment.content}</span>
          <span className="ml-1 text-muted-foreground/60">· {formatRelativeTime(track.lastComment.createdAt)}</span>
        </div>
      )}

      <div className="flex flex-col items-start gap-2 mt-1 md:flex-row md:items-center">
        {track.versionCount === 0 && canEdit ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setAddVersionOpen(true); }}
            className="text-sm h-8 px-3"
          >
            + Ajouter une version
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              disabled={track.versionCount === 0 || isLoadingPlay}
              className={`text-sm h-8 px-3 ${isCurrentlyPlaying ? "text-accent" : ""}`}
            >
              {isLoadingPlay ? "…" : isCurrentlyPlaying ? "⏸ En lecture" : isCurrentTrack ? "▶ Reprendre" : "▶ Écouter dernière version"}
            </Button>
            {playError && (
              <span className="text-xs text-destructive">Impossible de charger l'audio.</span>
            )}
          </>
        )}

        {canEdit && !track.archived && !confirmArchive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setConfirmArchive(true); }}
            aria-label={`Archiver ${track.name}`}
            className="text-sm h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            Archiver
          </Button>
        )}
        {canEdit && !track.archived && confirmArchive && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Archiver cette track ?</span>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmArchive(false); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                archiveTrack.mutate(track.id, {
                  onError: (err) => {
                    setConfirmArchive(false);
                    if (!isUnauthorizedError(err)) toastError(describeError(err, "Impossible d'archiver la track."));
                  },
                });
              }}
              disabled={archiveTrack.isPending}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              {archiveTrack.isPending ? "…" : "Confirmer"}
            </button>
          </div>
        )}
        {canEdit && track.archived && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              unarchiveTrack.mutate(track.id, {
                onError: (err) => {
                  if (!isUnauthorizedError(err)) toastError(describeError(err, "Impossible de désarchiver la track."));
                },
              });
            }}
            disabled={unarchiveTrack.isPending}
            aria-label={`Désarchiver ${track.name}`}
            className="text-sm h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            Désarchiver
          </Button>
        )}
      </div>

      <AddVersionDialog
        projectId={projectId}
        trackId={track.id}
        open={addVersionOpen}
        onClose={() => setAddVersionOpen(false)}
      />
    </div>
  );
}
