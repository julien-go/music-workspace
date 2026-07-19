import { Play, Pause, X } from "lucide-react";
import { usePlayerStore, type PlayingVersion } from "@/store/playerStore";
import { getFileExtension, stripFileExtension } from "@/lib/utils";
import { useAudioPlayer } from "./hooks/useAudioPlayer";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayPauseButton({
  isPlaying,
  onToggle,
  label,
  className,
  iconClassName = "w-6 h-6",
}: {
  isPlaying: boolean;
  onToggle: () => void;
  label: string;
  className: string;
  iconClassName?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={className}
      title={isPlaying ? "Pause" : "Lecture"}
      aria-label={label}
    >
      {isPlaying ? <Pause className={iconClassName} /> : <Play className={iconClassName} />}
    </button>
  );
}

export function PersistentPlayer() {
  const { current, isPlaying, pause, resume, stop } = usePlayerStore();
  const {
    progress,
    duration,
    volume,
    isMuted,
    VolumeIcon,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    audioProps,
  } = useAudioPlayer(current, isPlaying);

  const toggle = isPlaying ? pause : resume;

  return (
    <div
      role="region"
      aria-label="Lecteur audio"
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border"
      hidden={!current}
    >
      <audio {...audioProps} onEnded={pause} />

      {current && (
        <PlayerBody
          current={current}
          isPlaying={isPlaying}
          onToggle={toggle}
          onStop={stop}
          progress={progress}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          VolumeIcon={VolumeIcon}
          onToggleMute={toggleMute}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek}
        />
      )}
    </div>
  );
}

type PlayerBodyProps = {
  current: PlayingVersion;
  isPlaying: boolean;
  onToggle: () => void;
  onStop: () => void;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  VolumeIcon: React.ComponentType<{ className?: string }>;
  onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
  onSeek: (v: number) => void;
};

function PlayerBody(props: PlayerBodyProps) {
  const { current, isPlaying, onToggle, onStop, progress, duration } = props;

  const trackLabel = `${current.trackName} v${current.versionNumber}`;
  const playLabel = isPlaying ? `Mettre en pause ${trackLabel}` : `Lire ${trackLabel}`;
  const progressValueText = `${formatTime(progress)} sur ${formatTime(duration)}`;

  const versionTitle =
    current.label ??
    (current.originalFileName ? stripFileExtension(current.originalFileName) : null);
  const versionExt = getFileExtension(current.originalFileName);

  return (
    <>
      {/* Volume omis sur mobile — géré par le téléphone. */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5 md:hidden">
        <div className="flex items-center gap-3">
          <PlayPauseButton
            isPlaying={isPlaying}
            onToggle={onToggle}
            label={playLabel}
            className="shrink-0 text-foreground hover:text-accent transition-colors"
          />
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
            onClick={onStop}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Fermer"
            aria-label="Fermer le lecteur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ProgressBar
          progress={progress}
          duration={duration}
          onSeek={props.onSeek}
          valueText={progressValueText}
          className="h-2 flex-1 cursor-pointer accent-accent"
        />
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
                <span className="text-lg text-muted-foreground italic max-w-80 truncate">
                  · {current.notes}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground/60">{current.projectName}</span>
          </div>

          <div className="flex items-center gap-4">
            <PlayPauseButton
              isPlaying={isPlaying}
              onToggle={onToggle}
              label={playLabel}
              className="text-foreground hover:text-accent transition-colors"
            />

            <span className="text-sm text-muted-foreground tabular-nums">
              {formatTime(progress)}
            </span>
            <ProgressBar
              progress={progress}
              duration={duration}
              onSeek={props.onSeek}
              valueText={progressValueText}
              className="w-96 h-2.5 accent-accent cursor-pointer"
            />
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatTime(duration)}
            </span>

            <div className="w-px h-6 bg-border" />

            <VolumeControl {...props} />

            <div className="w-px h-6 bg-border" />

            <button
              onClick={onStop}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Fermer"
              aria-label="Fermer le lecteur"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ProgressBar({
  progress,
  duration,
  onSeek,
  valueText,
  className,
}: {
  progress: number;
  duration: number;
  onSeek: (v: number) => void;
  valueText: string;
  className: string;
}) {
  return (
    <input
      type="range"
      min={0}
      max={duration || 100}
      value={progress}
      step={0.1}
      onChange={(e) => onSeek(Number(e.target.value))}
      className={className}
      aria-label="Progression"
      aria-valuetext={valueText}
    />
  );
}

function VolumeControl({
  volume,
  isMuted,
  VolumeIcon,
  onToggleMute,
  onVolumeChange,
}: PlayerBodyProps) {
  const level = isMuted ? 0 : volume;
  return (
    <>
      <button
        onClick={onToggleMute}
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
        value={level}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-28 h-2.5 cursor-pointer"
        style={{ accentColor: "#ffffff" }}
        aria-label="Volume"
        aria-valuetext={`${Math.round(level * 100)}%`}
      />
    </>
  );
}
