import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerStore } from "@/store/playerStore";
import { notifyError } from "@/lib/toast";
import { queryKeys } from "@/lib/queryKeys";
import { getTrackVersions } from "../api";
import { useArchiveTrack } from "./useArchiveTrack";
import { useUnarchiveTrack } from "./useUnarchiveTrack";
import type { TrackResponse } from "../types";

export function useTrackActions(
  projectId: string,
  projectName: string,
  track: TrackResponse,
) {
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isCurrentTrack = current?.trackId === track.id;
  const queryClient = useQueryClient();

  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [addVersionOpen, setAddVersionOpen] = useState(false);
  const archiveTrack = useArchiveTrack(projectId);
  const unarchiveTrack = useUnarchiveTrack(projectId);

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
        queryKey: queryKeys.trackVersions(projectId, track.id),
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

  const confirmArchiveAction = () =>
    archiveTrack.mutate(track.id, {
      onError: (err) => {
        setConfirmArchive(false);
        notifyError(err, "Impossible d'archiver la track.");
      },
    });

  const unarchiveAction = () =>
    unarchiveTrack.mutate(track.id, {
      onError: (err) => {
        notifyError(err, "Impossible de désarchiver la track.");
      },
    });

  return {
    isLoadingPlay,
    playError,
    handlePlay,
    confirmArchive,
    setConfirmArchive,
    confirmArchiveAction,
    archivePending: archiveTrack.isPending,
    unarchiveAction,
    unarchivePending: unarchiveTrack.isPending,
    addVersionOpen,
    setAddVersionOpen,
  };
}
