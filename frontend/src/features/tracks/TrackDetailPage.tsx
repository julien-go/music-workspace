import { getRouteApi, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CommentThread } from "@/features/comments/components/CommentThread";
import { ErrorState } from "@/components/ErrorState";
import { SkeletonTrackDetail } from "@/components/SkeletonTrackDetail";
import { describeError } from "@/lib/api";
import { useDocumentTitle } from "@/components/hooks/useDocumentTitle";
import { useTrackDetail } from "./hooks/useTrackDetail";
import { TrackHeader } from "./components/TrackHeader";
import { TrackVersionsSection } from "./components/TrackVersionsSection";
import { TrackInfoSidebar } from "./components/TrackInfoSidebar";
import { AddVersionDialog } from "./components/AddVersionDialog";

const routeApi = getRouteApi("/auth-layout/projects/$projectId/tracks/$trackId");

export default function TrackDetailPage() {
  const { projectId, trackId } = routeApi.useParams();
  const d = useTrackDetail(projectId, trackId);
  useDocumentTitle(d.track?.name);

  if (d.loading) return <SkeletonTrackDetail />;
  if (d.isError) {
    return (
      <ErrorState
        message={describeError(d.errorObj, "Impossible de charger cette track.")}
        onRetry={d.refetch}
      />
    );
  }
  if (!d.project || !d.track) return null;
  const { project, track } = d;

  const sidebar = (
    <TrackInfoSidebar
      projectId={projectId}
      isOwner={d.isOwner}
      track={track}
      versionCount={d.versions.length}
    />
  );

  return (
    <div className="max-w-300 mx-auto px-4 md:px-6 py-8">
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-wrap">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden shrink-0 gap-1.5">
                  <Users className="w-4 h-4" />
                  Membres
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 max-w-[85vw] overflow-y-auto p-4">
                <SheetTitle className="sr-only">Membres et infos</SheetTitle>
                <div className="flex flex-col gap-4">{sidebar}</div>
              </SheetContent>
            </Sheet>
          </div>

          <TrackHeader
            track={track}
            canEdit={d.canEdit}
            updateTrack={d.updateTrack}
            onAddVersion={() => d.setAddVersionOpen(true)}
          />

          <TrackVersionsSection
            versionsLoading={d.versionsLoading}
            versionsError={d.versionsError}
            versionCount={d.versions.length}
            sortedVersions={d.sortedVersions}
            canEdit={d.canEdit}
            isOwner={d.isOwner}
            projectId={projectId}
            trackId={trackId}
            trackName={track.name}
            projectName={project.name}
          />

          <Separator className="mb-8" />

          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Commentaires
            </h2>
            <CommentThread
              comments={d.trackComments}
              isLoading={d.commentsLoading}
              loadError={d.commentsError}
              currentUserId={d.currentUser?.id}
              isOwner={d.isOwner}
              onAdd={(content) => d.addTrackComment.mutateAsync(content)}
              isAdding={d.addTrackComment.isPending}
              onDelete={(commentId) => d.deleteTrackComment.mutateAsync(commentId)}
            />
          </div>
        </div>

        <div className="hidden md:flex w-72 shrink-0 sticky top-8 flex-col gap-4">{sidebar}</div>
      </div>

      {d.canEdit && (
        <AddVersionDialog
          projectId={projectId}
          trackId={trackId}
          open={d.addVersionOpen}
          onClose={() => d.setAddVersionOpen(false)}
        />
      )}
    </div>
  );
}
