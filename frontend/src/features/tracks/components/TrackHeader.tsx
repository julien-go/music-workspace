import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "@/components/InlineEdit";
import type { useUpdateTrack } from "../hooks/useUpdateTrack";
import {
  TRACK_STATUS_LABEL,
  TRACK_STATUS_CLASS,
  type TrackResponse,
  type TrackStatus,
} from "../types";

function StatusControl({
  track,
  canEdit,
  updateTrack,
}: {
  track: TrackResponse;
  canEdit: boolean;
  updateTrack: ReturnType<typeof useUpdateTrack>;
}) {
  if (!canEdit) {
    return (
      <Badge variant="outline" className={`text-sm ${TRACK_STATUS_CLASS[track.status]}`}>
        {TRACK_STATUS_LABEL[track.status]}
      </Badge>
    );
  }
  return (
    <select
      value={track.status}
      onChange={(e) => updateTrack.mutate({ status: e.target.value as TrackStatus })}
      disabled={updateTrack.isPending}
      aria-label="Statut de la track"
      className={`text-sm border rounded-md px-2 py-1 bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${TRACK_STATUS_CLASS[track.status]}`}
    >
      <option value="DRAFT">Brouillon</option>
      <option value="IN_PROGRESS">En cours</option>
      <option value="DONE">Terminé</option>
    </select>
  );
}

export function TrackHeader({
  track,
  canEdit,
  updateTrack,
  onAddVersion,
}: {
  track: TrackResponse;
  canEdit: boolean;
  updateTrack: ReturnType<typeof useUpdateTrack>;
  onAddVersion: () => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <InlineEdit
          value={track.name}
          onSave={canEdit ? (name) => updateTrack.mutateAsync({ name }) : undefined}
          ariaLabel="Nom de la track"
          className="text-2xl font-bold font-heading text-foreground leading-tight"
        />
        <div className="flex items-center gap-2 shrink-0">
          <StatusControl track={track} canEdit={canEdit} updateTrack={updateTrack} />
          {canEdit && (
            <Button size="sm" onClick={onAddVersion}>
              + Nouvelle version
            </Button>
          )}
        </div>
      </div>
      <InlineEdit
        value={track.description ?? ""}
        onSave={canEdit ? (description) => updateTrack.mutateAsync({ description }) : undefined}
        multiline
        ariaLabel="Description de la track"
        className="text-base text-foreground/70 whitespace-pre-wrap"
        emptyLabel={canEdit ? "Ajouter une description" : undefined}
      />
    </div>
  );
}
