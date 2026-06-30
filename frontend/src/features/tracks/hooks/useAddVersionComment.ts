import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addVersionComment } from "../api";

export function useAddVersionComment(projectId: string, trackId: string, versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addVersionComment(projectId, trackId, versionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versionComments", projectId, trackId, versionId] });
    },
  });
}
