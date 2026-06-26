import { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PersistentPlayer() {
  const { current, isPlaying, pause, resume, stop } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevVersionIdRef = useRef<string | null>(null);
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!current) {
      audio.pause();
      audio.src = "";
      prevVersionIdRef.current = null;
      setProgress(0);
      setDuration(0);
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

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-28 bg-surface border-t border-border z-50 flex items-center justify-center px-8">
      <audio
        ref={audioRef}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={pause}
      />

      <div className="flex flex-col items-center gap-3">

        {/* Ligne 1 — texte x2 */}
        <div className="flex items-center gap-3">
          <span className="text-lg text-muted-foreground">{current.projectName}</span>
          <span className="text-muted-foreground/40">—</span>
          <span className="text-xl font-semibold text-foreground">{current.trackName}</span>
          <span className="text-xl font-mono text-accent">v{current.versionNumber}</span>
          {current.notes && (
            <span className="text-lg text-muted-foreground italic max-w-80 truncate">· {current.notes}</span>
          )}
        </div>

        {/* Ligne 2 — contrôles x1.5 */}
        <div className="flex items-center gap-4">
          <button
            onClick={isPlaying ? pause : resume}
            className="text-foreground hover:text-accent transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          <span className="text-sm text-muted-foreground tabular-nums">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            step={0.1}
            onChange={(e) => {
              const val = Number(e.target.value);
              setProgress(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-96 h-2.5 accent-accent cursor-pointer"
          />
          <span className="text-sm text-muted-foreground tabular-nums">{formatTime(duration)}</span>

          <div className="w-px h-6 bg-border" />

          <button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            <VolumeIcon className="w-6 h-6" />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-28 h-2.5 cursor-pointer"
            style={{ accentColor: "#ffffff" }}
          />

          <div className="w-px h-6 bg-border" />

          <button
            onClick={stop}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
