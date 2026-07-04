import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MembersSidebar } from "@/features/projects/components/MembersSidebar";
import { formatRelativeTime } from "@/lib/utils";
import { TRACK_STATUS_LABEL, TRACK_STATUS_CLASS, type TrackResponse } from "../types";

export function TrackInfoSidebar({
  projectId,
  isOwner,
  track,
  versionCount,
}: {
  projectId: string;
  isOwner: boolean;
  track: TrackResponse;
  versionCount: number;
}) {
  return (
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
            <dd className="text-foreground">{versionCount}</dd>
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
}
