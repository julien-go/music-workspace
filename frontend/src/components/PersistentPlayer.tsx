import { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { getFileExtension, stripFileExtension } from "@/lib/utils";

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

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

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

  if (!current) return null;

  const versionTitle =
    current.label ??
    (current.originalFileName ? stripFileExtension(current.originalFileName) : null);
  const versionExt = getFileExtension(current.originalFileName);

  const trackLabel = `${current.trackName} v${current.versionNumber}`;
  const playLabel = isPlaying ? `Mettre en pause ${trackLabel}` : `Lire ${trackLabel}`;
  const progressValueText = `${formatTime(progress)} sur ${formatTime(duration)}`;

  return (
    <div
      role="region"
      aria-label="Lecteur audio"
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={pause}
      />

      {/* Volume omis sur mobile — géré par le téléphone. */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={isPlaying ? pause : resume}
            className="shrink-0 text-foreground hover:text-accent transition-colors"
            title={isPlaying ? "Pause" : "Lecture"}
            aria-label={playLabel}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {current.trackName}
              </span>
              <span className="shrink-0 text-sm font-mono text-accent">
                v{current.versionNumber}
              </span>
            </div>
            <span className="block truncate text-xs text-muted-foreground/60">
              {current.projectName}
            </span>
          </div>
          <button
            onClick={stop}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Fermer"
            aria-label="Fermer le lecteur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            step={0.1}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-accent"
            aria-label="Progression"
            aria-valuetext={progressValueText}
          />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="hidden h-28 items-center justify-center px-8 md:flex">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-foreground">{current.trackName}</span>
              <span className="text-xl font-mono text-accent">v{current.versionNumber}</span>
              {versionTitle && (
                <span className="text-lg text-foreground/80 max-w-60 truncate">{versionTitle}</span>
              )}
              {versionExt && (
                <span className="text-xs font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  {versionExt}
                </span>
              )}
              {current.notes && (
                <span className="text-lg text-muted-foreground italic max-w-80 truncate">· {current.notes}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground/60">{current.projectName}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={isPlaying ? pause : resume}
              className="text-foreground hover:text-accent transition-colors"
              aria-label={playLabel}
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
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-96 h-2.5 accent-accent cursor-pointer"
              aria-label="Progression"
              aria-valuetext={progressValueText}
            />
            <span className="text-sm text-muted-foreground tabular-nums">{formatTime(duration)}</span>

            <div className="w-px h-6 bg-border" />

            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={isMuted ? "Activer le son" : "Couper le son"}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
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
              aria-label="Volume"
              aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />

            <div className="w-px h-6 bg-border" />

            <button
              onClick={stop}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Fermer"
              aria-label="Fermer le lecteur"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
