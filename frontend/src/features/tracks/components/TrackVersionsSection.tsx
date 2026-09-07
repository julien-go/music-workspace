import { VersionCard } from "./VersionCard";
import type { TrackVersionResponse } from "../types";

type Props = {
  versionsLoading: boolean;
  versionsError: boolean;
  versionCount: number;
  sortedVersions: TrackVersionResponse[];
  canEdit: boolean;
  isOwner: boolean;
  projectId: string;
  trackId: string;
  trackName: string;
  projectName: string;
};

function VersionsBody({
  versionsLoading,
  versionsError,
  versionCount,
  sortedVersions,
  canEdit,
  isOwner,
  projectId,
  trackId,
  trackName,
  projectName,
}: Props) {
  if (versionsLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-28 bg-surface rounded-lg" />
        ))}
      </div>
    );
  }
  if (versionsError) {
    return <p className="text-sm text-destructive">Impossible de charger les versions.</p>;
  }
  if (versionCount === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
        <p className="text-base">Aucune version pour le moment.</p>
        {canEdit && <p className="text-sm mt-1">Ajoutez une première version pour commencer.</p>}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {sortedVersions.map((version) => (
        <VersionCard
          key={version.id}
          version={version}
          projectId={projectId}
          trackId={trackId}
          trackName={trackName}
          projectName={projectName}
          isOwner={isOwner}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

export function TrackVersionsSection(props: Props) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
        Versions
        {props.versionCount > 0 && (
          <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
            {props.versionCount}
          </span>
        )}
      </h2>
      <VersionsBody {...props} />
    </div>
  );
}
