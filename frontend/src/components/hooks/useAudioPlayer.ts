import { useRef, useEffect, useState } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import type { PlayingVersion } from "@/store/playerStore";

// Owns the <audio> element and all playback state (progress, volume, mute).
// The component stays presentational: wire `audioProps` onto <audio> and read
// the returned state/handlers.
export function useAudioPlayer(
  current: PlayingVersion | null,
  isPlaying: boolean,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevVersionIdRef = useRef<string | null>(null);
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shownVersionId, setShownVersionId] = useState<string | null>(
    current?.versionId ?? null,
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!current) {
      audio.pause();
      audio.src = "";
      prevVersionIdRef.current = null;
      return;
    }

    if (current.versionId !== prevVersionIdRef.current) {
      prevVersionIdRef.current = current.versionId;
      audio.src = current.audioUrl;
      audio.volume = volumeRef.current;
      audio.muted = mutedRef.current;
      audio.load();
      if (isPlaying) audio.play().catch(() => {});
      return;
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [current, isPlaying]);

  const toggleMute = () => {
    const next = !isMuted;
    mutedRef.current = next;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  const handleVolumeChange = (val: number) => {
    volumeRef.current = val;
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val === 0) {
      mutedRef.current = true;
      setIsMuted(true);
      if (audioRef.current) audioRef.current.muted = true;
    } else if (isMuted) {
      mutedRef.current = false;
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
  };

  const handleSeek = (val: number) => {
    setProgress(val);
    if (audioRef.current) audioRef.current.currentTime = val;
  };

  // Reset transient progress during render when playback is torn down
  // ("adjust state on change" — keeps it out of the audio-sync effect).
  const currentVersionId = current?.versionId ?? null;
  if (currentVersionId !== shownVersionId) {
    setShownVersionId(currentVersionId);
    if (currentVersionId === null) {
      setProgress(0);
      setDuration(0);
    }
  }

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return {
    progress,
    duration,
    volume,
    isMuted,
    VolumeIcon,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    audioProps: {
      ref: audioRef,
      onTimeUpdate: () => setProgress(audioRef.current?.currentTime ?? 0),
      onLoadedMetadata: () => setDuration(audioRef.current?.duration ?? 0),
    },
  };
}
