import { useState, useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { CommentThread } from "./components/CommentThread";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime } from "@/lib/utils";
import type { TrackStatus } from "./types";

const statusLabel: Record<TrackStatus, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

const statusClass: Record<TrackStatus, string> = {
  DRAFT: "text-muted-foreground border-border",
  IN_PROGRESS: "text-amber-400 border-amber-400/40",
  DONE: "text-emerald-400 border-emerald-400/40",
};

function TrackDetailSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-pulse">
      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="h-4 w-72 bg-surface rounded" />
          <div className="h-8 w-64 bg-surface rounded" />
          <div className="space-y-3 mt-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
        <div className="w-72 shrink-0 h-64 bg-surface rounded-lg" />
      </div>
    </div>
  );
}

export default function TrackDetailPage() {
  const { projectId = "", trackId = "" } = useParams({ strict: false }) as {
    projectId?: string;
    trackId?: string;
  };
  const currentUser = useAuthStore((s) => s.user);

  const { data: project, isLoading: projectLoading, isError: projectError } = useProject(projectId);
  const { data: track, isLoading: trackLoading, isError: trackError } = useTrack(projectId, trackId);
  const { data: versions = [], isLoading: versionsLoading } = useTrackVersions(projectId, trackId);
  const { data: trackComments = [], isLoading: commentsLoading } = useTrackComments(projectId, trackId);

  const updateTrack = useUpdateTrack(projectId, trackId);
  const addTrackComment = useAddTrackComment(projectId, trackId);
  const deleteTrackComment = useDeleteTrackComment(projectId, trackId);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteCommentError, setDeleteCommentError] = useState<string | null>(null);
  const [addVersionOpen, setAddVersionOpen] = useState(false);

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions],
  );

  if (projectLoading || trackLoading) return <TrackDetailSkeleton />;

  if (projectError || trackError) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Cette track est introuvable ou vous n'y avez pas accès.
        </p>
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          className="text-sm text-accent hover:underline"
        >
          Retour au projet
        </Link>
      </div>
    );
  }

  if (!project || !track) return null;

  const canEdit =
    project.currentUserRole === "OWNER" || project.currentUserRole === "COLLABORATOR";
  const isOwner = project.currentUserRole === "OWNER";

  const handleDeleteTrackComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    setDeleteCommentError(null);
    deleteTrackComment.mutate(commentId, {
      onSettled: () => setDeletingCommentId(null),
      onError: () => setDeleteCommentError("Impossible de supprimer ce commentaire."),
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex gap-8 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
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

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-3">
              <InlineEdit
                value={track.name}
                onSave={canEdit ? (name) => updateTrack.mutateAsync({ name }) : undefined}
                className="text-2xl font-bold font-heading text-foreground leading-tight"
              />
              <div className="flex items-center gap-2 shrink-0">
                {canEdit ? (
                  <select
                    value={track.status}
                    onChange={(e) =>
                      updateTrack.mutate({ status: e.target.value as TrackStatus })
                    }
                    disabled={updateTrack.isPending}
                    className={`text-sm border rounded-md px-2 py-1 bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${statusClass[track.status]}`}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="DONE">Terminé</option>
                  </select>
                ) : (
                  <Badge variant="outline" className={`text-sm ${statusClass[track.status]}`}>
                    {statusLabel[track.status]}
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
              onSave={canEdit ? (description) => updateTrack.mutateAsync({ description }) : undefined}
              multiline
              className="text-base text-foreground/70 whitespace-pre-wrap"
              emptyLabel={canEdit ? "Ajouter une description" : undefined}
            />
          </div>

          {/* Versions */}
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

            {!versionsLoading && versions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-base">Aucune version pour le moment.</p>
                {canEdit && (
                  <p className="text-sm mt-1">Ajoutez une première version pour commencer.</p>
                )}
              </div>
            )}

            {!versionsLoading && sortedVersions.length > 0 && (
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
                  />
                ))}
              </div>
            )}
          </div>

          <Separator className="mb-8" />

          {/* Track comments */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Commentaires
            </h2>
            <CommentThread
              comments={trackComments}
              isLoading={commentsLoading}
              currentUserId={currentUser?.id}
              isOwner={isOwner}
              onAdd={(content) => addTrackComment.mutateAsync(content)}
              isAdding={addTrackComment.isPending}
              onDelete={handleDeleteTrackComment}
              deletingId={deletingCommentId}
              deleteError={deleteCommentError}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 shrink-0 sticky top-8 flex flex-col gap-4">
          <MembersSidebar projectId={projectId} isOwner={isOwner} />

          {/* Track info */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground text-base mb-4">Infos</h2>
            <Separator className="mb-4" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center gap-2">
                <dt className="text-muted-foreground">Statut</dt>
                <dd>
                  <Badge variant="outline" className={`text-xs ${statusClass[track.status]}`}>
                    {statusLabel[track.status]}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between items-center gap-2">
                <dt className="text-muted-foreground">Versions</dt>
                <dd className="text-foreground">{versions.length}</dd>
              </div>
              <div className="flex justify-between items-center gap-2">
                <dt className="text-muted-foreground">Créée</dt>
                <dd className="text-foreground">{formatRelativeTime(track.createdAt)}</dd>
              </div>
            </dl>
            {track.archived && (
              <div className="mt-4 px-3 py-2 rounded-md bg-amber-400/10 border border-amber-400/20 text-xs text-amber-400">
                Cette track est archivée.
              </div>
            )}
          </div>
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
