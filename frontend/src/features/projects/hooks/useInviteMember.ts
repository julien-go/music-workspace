import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMember } from "../api";
import type { InviteMemberRequest } from "../types";

export function useInviteMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteMemberRequest) => addMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
    },
  });
}
