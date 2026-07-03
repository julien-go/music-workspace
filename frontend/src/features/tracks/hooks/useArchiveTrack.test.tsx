import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useArchiveTrack } from "./useArchiveTrack";
import { archiveTrack } from "../api";
import type { TrackResponse } from "../types";

vi.mock("../api", () => ({
  archiveTrack: vi.fn(),
}));

const projectId = "project-1";

function makeTrack(overrides: Partial<TrackResponse> = {}): TrackResponse {
  return {
    id: "track-1",
    position: 0,
    name: "Intro",
    description: null,
    status: "DRAFT",
    archived: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    versionCount: 0,
    lastVersionNote: null,
    lastComment: null,
    ...overrides,
  };
}

function setup(tracks: TrackResponse[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(["tracks", projectId], tracks);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useArchiveTrack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes the track from the active list optimistically", async () => {
    const { queryClient, wrapper } = setup([
      makeTrack(),
      makeTrack({ id: "track-2", name: "Outro", position: 1 }),
    ]);
    vi.mocked(archiveTrack).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useArchiveTrack(projectId), { wrapper });
    result.current.mutate("track-1");

    await waitFor(() => {
      const tracks = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId]);
      expect(tracks?.map((t) => t.id)).toEqual(["track-2"]);
    });
  });

  it("restores the active list when the mutation fails", async () => {
    const { queryClient, wrapper } = setup([makeTrack()]);
    vi.mocked(archiveTrack).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useArchiveTrack(projectId), { wrapper });
    result.current.mutate("track-1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    const tracks = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId]);
    expect(tracks?.map((t) => t.id)).toEqual(["track-1"]);
  });

  it("invalidates both active and archived lists once settled", async () => {
    const { queryClient, wrapper } = setup([makeTrack()]);
    vi.mocked(archiveTrack).mockResolvedValue(makeTrack({ archived: true }));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useArchiveTrack(projectId), { wrapper });
    result.current.mutate("track-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["tracks", projectId] });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["tracks", projectId, "archived"],
    });
  });
});
