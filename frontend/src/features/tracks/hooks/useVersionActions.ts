import { usePlayerStore } from "@/store/playerStore";
import type { TrackVersionResponse } from "../types";

// Playback action for a single version card. (Versions are immutable by
// design — no delete/download exists on this card.)
export function useVersionActions(
  version: TrackVersionResponse,
  ctx: { projectId: string; projectName: string; trackId: string; trackName: string },
) {
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isCurrentVersion = current?.versionId === version.id;
  const isCurrentlyPlaying = isCurrentVersion && isPlaying;

  const handlePlay = () => {
    if (isCurrentVersion) {
      if (isCurrentlyPlaying) pause();
      else resume();
      return;
    }
    play({
      projectId: ctx.projectId,
      projectName: ctx.projectName,
      trackId: ctx.trackId,
      trackName: ctx.trackName,
      versionId: version.id,
      versionNumber: version.versionNumber,
      audioUrl: version.audioUrl,
      notes: version.notes,
      label: version.label,
      originalFileName: version.originalFileName,
    });
  };

  return { isCurrentVersion, isCurrentlyPlaying, handlePlay };
}
