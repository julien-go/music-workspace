import { usePlayerStore } from "@/store/playerStore";
import type { TrackResponse } from "../types";

export function useTrackCard(track: TrackResponse, canEdit: boolean) {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isCurrentTrack = current?.trackId === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  // Editing an archived track is rejected server-side (409) — hide the affordances.
  const canEditContent = canEdit && !track.archived;
  const versionsLabel = `${track.versionCount} version${
    track.versionCount !== 1 ? "s" : ""
  }`;

  return { isCurrentTrack, isCurrentlyPlaying, canEditContent, versionsLabel };
}
