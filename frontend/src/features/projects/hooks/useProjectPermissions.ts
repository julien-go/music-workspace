import { useMemo } from "react";
import type { ProjectResponse } from "../types";

// Resolves the current user's capabilities from their project role.
export function useProjectPermissions(project: ProjectResponse | undefined) {
  return useMemo(() => {
    const role = project?.currentUserRole;
    const isOwner = role === "OWNER";
    const canEdit = isOwner || role === "COLLABORATOR";
    return { canEdit, isOwner };
  }, [project?.currentUserRole]);
}
