import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });
}
