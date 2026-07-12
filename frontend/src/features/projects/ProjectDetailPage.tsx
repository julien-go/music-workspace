import { getRouteApi, Link } from "@tanstack/react-router";
import { Settings, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InlineEdit } from "@/components/InlineEdit";
import { ErrorState } from "@/components/ErrorState";
import { SkeletonProjectDetail } from "@/components/SkeletonProjectDetail";
import { describeError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TaskKanban } from "@/features/tasks/components/TaskKanban";
import { CommentThread } from "@/features/comments/components/CommentThread";
import { useDocumentTitle } from "@/components/hooks/useDocumentTitle";
import { useProjectDetail } from "./hooks/useProjectDetail";
import { useProjectPermissions } from "./hooks/useProjectPermissions";
import { MembersSidebar } from "./components/MembersSidebar";
import { ShareProjectButton } from "./components/ShareProjectButton";
import { ProjectSettingsDialog } from "./components/ProjectSettingsDialog";
import { ProjectCoverWithLightbox } from "./components/ProjectCoverWithLightbox";
import { TracksSection } from "./components/TracksSection";
import { CreateTrackDialog } from "@/features/tracks/components/CreateTrackDialog";

const routeApi = getRouteApi("/auth-layout/projects/$projectId");

export default function ProjectDetailPage() {
  const { projectId } = routeApi.useParams();
  const d = useProjectDetail(projectId);
  const { canEdit, isOwner } = useProjectPermissions(d.project);
  useDocumentTitle(d.project?.name);

  if (d.projectLoading) return <SkeletonProjectDetail />;
  if (d.projectError)
    return (
      <ErrorState
        message={describeError(
          d.projectErrorObj,
          "Impossible de charger ce projet.",
        )}
        onRetry={() => d.refetchProject()}
      />
    );
  if (!d.project) return null;
  const project = d.project;

  return (
    <div className="max-w-300 mx-auto px-4 md:px-6 py-8">
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Link
                to="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-foreground truncate">{project.name}</span>
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
                <SheetTitle className="sr-only">Membres</SheetTitle>
                <MembersSidebar projectId={projectId} isOwner={isOwner} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-start gap-4 mb-8">
            <ProjectCoverWithLightbox
              name={project.name}
              coverUrl={project.coverUrl}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <InlineEdit
                  value={project.name}
                  onSave={
                    canEdit
                      ? (name) => d.updateProject.mutateAsync({ name })
                      : undefined
                  }
                  ariaLabel="Nom du projet"
                  className="text-2xl font-bold font-heading text-foreground leading-tight"
                />
                {isOwner && (
                  <button
                    onClick={() => d.setSettingsOpen(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1"
                    title="Paramètres du projet"
                    aria-label="Paramètres du projet"
                  >
                    <Settings className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <InlineEdit
                value={project.description ?? ""}
                onSave={
                  canEdit
                    ? (description) =>
                        d.updateProject.mutateAsync({ description })
                    : undefined
                }
                multiline
                ariaLabel="Description du projet"
                className="text-sm text-muted-foreground whitespace-pre-wrap"
                emptyLabel={canEdit ? "Ajouter une description" : undefined}
              />
              {isOwner && (
                <div className="mt-3">
                  <ShareProjectButton project={project} />
                </div>
              )}
            </div>
          </div>

          <TracksSection
            tracks={d.tracks}
            tracksLoading={d.tracksLoading}
            isTracksError={d.isTracksError}
            canEdit={canEdit}
            onCreateTrack={() => d.setCreateTrackOpen(true)}
            sensors={d.sensors}
            onDragEnd={d.handleDragEnd}
            orderedIds={d.orderedIds}
            orderedTracks={d.orderedTracks}
            reorderPending={d.reorderPending}
            showArchived={d.showArchived}
            onToggleArchived={() => d.setShowArchived((v) => !v)}
            archivedTracks={d.archivedTracks}
            archivedLoading={d.archivedLoading}
            isArchivedError={d.isArchivedError}
            projectId={projectId}
            projectName={project.name}
          />

          <Separator className="mb-8" />

          <div className="mb-10">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Tâches
            </h2>
            <TaskKanban projectId={projectId} canEdit={canEdit} />
          </div>

          <Separator className="mb-8" />

          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Commentaires
            </h2>
            <CommentThread
              comments={d.projectComments}
              isLoading={d.commentsLoading}
              loadError={d.commentsError}
              currentUserId={d.currentUser?.id}
              isOwner={isOwner}
              onAdd={(content) => d.addProjectComment.mutateAsync(content)}
              isAdding={d.addProjectComment.isPending}
              onDelete={(commentId) =>
                d.deleteProjectComment.mutateAsync(commentId)
              }
            />
          </div>
        </div>

        <div className="hidden md:block w-72 shrink-0 sticky top-8">
          <MembersSidebar projectId={projectId} isOwner={isOwner} />
        </div>
      </div>

      {canEdit && (
        <CreateTrackDialog
          projectId={projectId}
          open={d.createTrackOpen}
          onClose={() => d.setCreateTrackOpen(false)}
        />
      )}
      {isOwner && (
        <ProjectSettingsDialog
          project={project}
          open={d.settingsOpen}
          onClose={() => d.setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
