import { useEffect } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { useDocumentTitle } from "@/components/hooks/useDocumentTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ErrorState";
import { ProjectCover } from "@/components/ProjectCover";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { ApiException, describeError } from "@/lib/api";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { TRACK_STATUS_LABEL, TRACK_STATUS_CLASS } from "@/features/tracks/types";
import { fetchPublicProject } from "./api";
import type { PublicProjectResponse, PublicTrackResponse } from "./types";

const routeApi = getRouteApi("/public-layout/p/$projectId");

function PublicProjectSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-32 h-32 rounded-lg bg-surface shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-7 w-2/3 bg-surface rounded" />
          <div className="h-4 w-1/3 bg-surface rounded" />
          <div className="h-4 w-full bg-surface rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-surface rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function PublicTrackRow({
  track,
  project,
}: {
  track: PublicTrackResponse;
  project: PublicProjectResponse;
}) {
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  // Primitive selectors so only the rows whose state actually changed re-render.
  const isCurrentVersion = usePlayerStore((s) => s.current?.versionId === track.latestVersionId);
  const isThisPlaying = usePlayerStore(
    (s) => s.isPlaying && s.current?.versionId === track.latestVersionId,
  );

  const handlePlay = () => {
    if (!track.latestVersionId || !track.latestAudioUrl) return;
    if (isCurrentVersion) {
      if (isThisPlaying) pause();
      else resume();
      return;
    }
    play({
      projectId: project.id,
      projectName: project.name,
      trackId: track.id,
      trackName: track.name,
      versionId: track.latestVersionId,
      versionNumber: track.latestVersionNumber,
      audioUrl: track.latestAudioUrl,
      origin: "public",
    });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-foreground text-lg leading-tight min-w-0 truncate">
          {track.name}
        </span>
        <Badge
          variant="outline"
          aria-label={`Statut : ${TRACK_STATUS_LABEL[track.status]}`}
          className={`shrink-0 text-sm ${TRACK_STATUS_CLASS[track.status]}`}
        >
          {TRACK_STATUS_LABEL[track.status]}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
        <span>
          {track.versionCount} version{track.versionCount !== 1 ? "s" : ""}
        </span>
      </div>
      {track.latestAudioUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className={`mt-2 text-sm h-8 px-3 ${isThisPlaying ? "text-accent" : ""}`}
        >
          {isThisPlaying
            ? "⏸ En lecture"
            : isCurrentVersion
              ? "▶ Reprendre"
              : "▶ Écouter dernière version"}
        </Button>
      )}
    </div>
  );
}

export default function PublicProjectPage() {
  const { projectId } = routeApi.useParams();
  const user = useAuthStore((s) => s.user);

  // Stop only playback that originated from this public view, so it doesn't carry
  // into the shared authenticated player when leaving.
  useEffect(() => {
    return () => {
      const { current, stop } = usePlayerStore.getState();
      if (current?.origin === "public" && current.projectId === projectId) {
        stop();
      }
    };
  }, [projectId]);

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.publicProject(projectId),
    queryFn: () => fetchPublicProject(projectId),
  });

  useDocumentTitle(project?.name);

  const notFound = isError && error instanceof ApiException && error.apiError.status === 404;

  // The player renders unconditionally (below) so a state change on this page
  // — e.g. the project turning private mid-playback — never unmounts it,
  // which would cut the audio and strand the store in a playing state.
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 pb-28">
        {isLoading && <PublicProjectSkeleton />}

        {notFound && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center gap-4">
            <p role="alert" className="text-lg font-semibold text-foreground">
              Projet introuvable
            </p>
            <p className="text-sm text-muted-foreground">
              Ce projet n'existe pas ou n'est plus partagé publiquement.
            </p>
            <Button variant="ghost" asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        )}

        {isError && !notFound && (
          <ErrorState
            message={describeError(error, "Impossible de charger ce projet.")}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && project && (
          <>
            <Badge variant="outline" className="mb-6 gap-1.5 text-muted-foreground">
              <Globe className="size-3.5" aria-hidden="true" />
              Vue publique
            </Badge>
            <div className="flex items-start gap-4 mb-10">
              <ProjectCover name={project.name} coverUrl={project.coverUrl} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold font-heading text-foreground leading-tight">
                  {project.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  un projet de <span className="text-foreground/80">{project.owner}</span>
                </p>
                {project.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Tracks
              {project.tracks.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                  {project.tracks.length}
                </span>
              )}
            </h2>

            {project.tracks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-base">Aucune track pour le moment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {project.tracks.map((track) => (
                  <PublicTrackRow key={track.id} track={track} project={project} />
                ))}
              </div>
            )}

            <Separator className="my-10" />

            <div className="text-center pb-4">
              {user ? (
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">Retour au tableau de bord</Link>
                </Button>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créez vos propres projets et collaborez en musique.
                  </p>
                  <Button asChild>
                    <Link to="/register">Rejoindre Music Workspace</Link>
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <PersistentPlayer />
    </>
  );
}
