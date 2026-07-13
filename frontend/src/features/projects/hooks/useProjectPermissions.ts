import { useMemo } from "react";
import type { ProjectResponse } from "../types";

export function useProjectPermissions(project: ProjectResponse | undefined) {
  return useMemo(() => {
    const role = project?.currentUserRole;
    const isOwner = role === "OWNER";
    const canEdit = isOwner || role === "COLLABORATOR";
    return { canEdit, isOwner };
  }, [project?.currentUserRole]);
}
