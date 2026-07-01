import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

export function useStopPlayerOnProjectChange(projectId: string) {
  useEffect(() => {
    const current = usePlayerStore.getState().current;
    if (current && current.projectId !== projectId) {
      usePlayerStore.getState().stop();
    }
  }, [projectId]);
}
