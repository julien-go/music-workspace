import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole } from "../api";
import type { ProjectRole } from "../types";

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Exclude<ProjectRole, "OWNER"> }) =>
      updateMemberRole(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
    },
  });
}
