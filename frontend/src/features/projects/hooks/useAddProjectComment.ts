import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProjectComment } from "../api";

export function useAddProjectComment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addProjectComment(projectId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectComments", projectId] });
    },
  });
}
