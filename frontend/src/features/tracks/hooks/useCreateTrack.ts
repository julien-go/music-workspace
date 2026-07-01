import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrack } from "../api";
import type { CreateTrackRequest } from "../types";

export function useCreateTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTrackRequest) => createTrack(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", projectId] });
    },
  });
}
