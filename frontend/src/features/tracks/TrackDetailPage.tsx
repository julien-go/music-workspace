import { useState, useMemo } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InlineEdit } from "@/components/InlineEdit";
import { MembersSidebar } from "@/features/projects/components/MembersSidebar";
import { useProject } from "@/features/projects/hooks/useProject";
import { useTrack } from "./hooks/useTrack";
import { useTrackVersions } from "./hooks/useTrackVersions";
import { useUpdateTrack } from "./hooks/useUpdateTrack";
import { useTrackComments } from "./hooks/useTrackComments";
import { useAddTrackComment } from "./hooks/useAddTrackComment";
import { useDeleteTrackComment } from "./hooks/useDeleteTrackComment";
import { VersionCard } from "./components/VersionCard";
import { AddVersionDialog } from "./components/AddVersionDialog";
import { CommentThread } from "@/features/comments/components/CommentThread";
import { ErrorState } from "@/components/ErrorState";
import { SkeletonTrackDetail } from "@/components/SkeletonTrackDetail";
import { describeError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime } from "@/lib/utils";
import { TRACK_STATUS_LABEL, TRACK_STATUS_CLASS, type TrackStatus } from "./types";

const routeApi = getRouteApi("/auth-layout/projects/$projectId/tracks/$trackId");

export default function TrackDetailPage() {
  const { projectId, trackId } = routeApi.useParams();
  const currentUser = useAuthStore((s) => s.user);

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorObj,
    refetch: refetchProject,
  } = useProject(projectId);
  const {
    data: track,
    isLoading: trackLoading,
    isError: trackError,
    error: trackErrorObj,
    refetch: refetchTrack,
  } = useTrack(projectId, trackId);
  const {
    data: versions = [],
    isLoading: versionsLoading,
    isError: versionsError,
  } = useTrackVersions(projectId, trackId);
  const {
    data: trackComments = [],
    isLoading: commentsLoading,
    isError: commentsError,
  } = useTrackComments(projectId, trackId);

  const updateTrack = useUpdateTrack(projectId, trackId);
  const addTrackComment = useAddTrackComment(projectId, trackId);
  const deleteTrackComment = useDeleteTrackComment(projectId, trackId);
  const [addVersionOpen, setAddVersionOpen] = useState(false);

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions],
  );

  if (projectLoading || trackLoading) return <SkeletonTrackDetail />;

  if (projectError || trackError) {
    return (
      <ErrorState
        message={describeError(projectErrorObj ?? trackErrorObj, "Impossible de charger cette track.")}
        onRetry={() => {
          refetchProject();
          refetchTrack();
        }}
      />
    );
  }

  if (!project || !track) return null;

  const hasWriteRole =
    project.currentUserRole === "OWNER" ||
    project.currentUserRole === "COLLABORATOR";
  // Everything on an archived track is read-only server-side (409) — don't
  // show edit affordances that can only fail.
  const canEdit = hasWriteRole && !track.archived;
  const isOwner = project.currentUserRole === "OWNER";

  const sidebarContent = (
    <>
      <MembersSidebar projectId={projectId} isOwner={isOwner} />

      <div className="bg-surface border border-border rounded-lg p-5 shadow-card">

        <h2 className="font-semibold text-foreground text-base mb-4">Infos</h2>
        <Separator className="mb-4" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between items-center gap-2">
            <dt className="text-muted-foreground">Statut</dt>
            <dd>
              <Badge
                variant="outline"
                className={`text-xs ${TRACK_STATUS_CLASS[track.status]}`}
              >
                {TRACK_STATUS_LABEL[track.status]}
              </Badge>
            </dd>
          </div>
          <div className="flex justify-between items-center gap-2">
            <dt className="text-muted-foreground">Versions</dt>
            <dd className="text-foreground">{versions.length}</dd>
          </div>
          <div className="flex justify-between items-center gap-2">
            <dt className="text-muted-foreground">Créée</dt>
            <dd className="text-foreground">
              {formatRelativeTime(track.createdAt)}
            </dd>
          </div>
        </dl>
        {track.archived && (
          <div className="mt-4 px-3 py-2 rounded-md bg-amber-400/10 border border-amber-400/20 text-xs text-amber-400">
            Cette track est archivée.
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-300 mx-auto px-4 md:px-6 py-8">
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-wrap">
              <Link
                to="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <span>/</span>
              <Link
                to="/projects/$projectId"
                params={{ projectId }}
                className="hover:text-foreground transition-colors"
              >
                {project.name}
              </Link>
              <span>/</span>
              <span className="text-foreground">{track.name}</span>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden shrink-0 gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  Membres
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 max-w-[85vw] overflow-y-auto p-4"
              >
                <SheetTitle className="sr-only">Membres et infos</SheetTitle>
                <div className="flex flex-col gap-4">{sidebarContent}</div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mb-8">
            <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-start md:justify-between md:gap-4">
              <InlineEdit
                value={track.name}
                onSave={
                  canEdit
                    ? (name) => updateTrack.mutateAsync({ name })
                    : undefined
                }
                ariaLabel="Nom de la track"
                className="text-2xl font-bold font-heading text-foreground leading-tight"
              />
              <div className="flex items-center gap-2 shrink-0">
                {canEdit ? (
                  <select
                    value={track.status}
                    onChange={(e) =>
                      updateTrack.mutate({
                        status: e.target.value as TrackStatus,
                      })
                    }
                    disabled={updateTrack.isPending}
                    aria-label="Statut de la track"
                    className={`text-sm border rounded-md px-2 py-1 bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${TRACK_STATUS_CLASS[track.status]}`}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="DONE">Terminé</option>
                  </select>
                ) : (
                  <Badge
                    variant="outline"
                    className={`text-sm ${TRACK_STATUS_CLASS[track.status]}`}
                  >
                    {TRACK_STATUS_LABEL[track.status]}
                  </Badge>
                )}
                {canEdit && (
                  <Button size="sm" onClick={() => setAddVersionOpen(true)}>
                    + Nouvelle version
                  </Button>
                )}
              </div>
            </div>
            <InlineEdit
              value={track.description ?? ""}
              onSave={
                canEdit
                  ? (description) => updateTrack.mutateAsync({ description })
                  : undefined
              }
              multiline
              ariaLabel="Description de la track"
              className="text-base text-foreground/70 whitespace-pre-wrap"
              emptyLabel={canEdit ? "Ajouter une description" : undefined}
            />
          </div>

          <div className="mb-10">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Versions
              {versions.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                  {versions.length}
                </span>
              )}
            </h2>

            {versionsLoading && (
              <div className="space-y-3 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-28 bg-surface rounded-lg" />
                ))}
              </div>
            )}

            {!versionsLoading && versionsError && (
              <p className="text-sm text-destructive">
                Impossible de charger les versions.
              </p>
            )}

            {!versionsLoading && !versionsError && versions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-base">Aucune version pour le moment.</p>
                {canEdit && (
                  <p className="text-sm mt-1">
                    Ajoutez une première version pour commencer.
                  </p>
                )}
              </div>
            )}

            {!versionsLoading && !versionsError && sortedVersions.length > 0 && (
              <div className="flex flex-col gap-3">
                {sortedVersions.map((version) => (
                  <VersionCard
                    key={version.id}
                    version={version}
                    projectId={projectId}
                    trackId={trackId}
                    trackName={track.name}
                    projectName={project.name}
                    isOwner={isOwner}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}
          </div>

          <Separator className="mb-8" />

          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Commentaires
            </h2>
            <CommentThread
              comments={trackComments}
              isLoading={commentsLoading}
              loadError={commentsError}
              currentUserId={currentUser?.id}
              isOwner={isOwner}
              onAdd={(content) => addTrackComment.mutateAsync(content)}
              isAdding={addTrackComment.isPending}
              onDelete={(commentId) => deleteTrackComment.mutateAsync(commentId)}
            />
          </div>
        </div>

        <div className="hidden md:flex w-72 shrink-0 sticky top-8 flex-col gap-4">
          {sidebarContent}
        </div>
      </div>

      {canEdit && (
        <AddVersionDialog
          projectId={projectId}
          trackId={trackId}
          open={addVersionOpen}
          onClose={() => setAddVersionOpen(false)}
        />
      )}
    </div>
  );
}
