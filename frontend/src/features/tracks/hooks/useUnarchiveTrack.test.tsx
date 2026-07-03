import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUnarchiveTrack } from "./useUnarchiveTrack";
import { unarchiveTrack } from "../api";
import type { TrackResponse } from "../types";

vi.mock("../api", () => ({
  unarchiveTrack: vi.fn(),
}));

const projectId = "project-1";

function makeTrack(overrides: Partial<TrackResponse> = {}): TrackResponse {
  return {
    id: "track-1",
    position: 0,
    name: "Intro",
    description: null,
    status: "DRAFT",
    archived: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    versionCount: 0,
    lastVersionNote: null,
    lastComment: null,
    ...overrides,
  };
}

function setup(active: TrackResponse[], archived: TrackResponse[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(["tracks", projectId], active);
  queryClient.setQueryData(["tracks", projectId, "archived"], archived);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useUnarchiveTrack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves the track from the archived list to the active list optimistically", async () => {
    const activeTrack = makeTrack({ id: "track-0", archived: false });
    const { queryClient, wrapper } = setup([activeTrack], [makeTrack()]);
    vi.mocked(unarchiveTrack).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUnarchiveTrack(projectId), { wrapper });
    result.current.mutate("track-1");

    await waitFor(() => {
      const active = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId]);
      expect(active?.map((t) => t.id)).toEqual(["track-0", "track-1"]);
    });
    const active = queryClient.getQueryData<TrackResponse[]>(["tracks", projectId]);
    expect(active?.find((t) => t.id === "track-1")?.archived).toBe(false);
    const archived = queryClient.getQueryData<TrackResponse[]>([
      "tracks",
      projectId,
      "archived",
    ]);
    expect(archived).toEqual([]);
  });

  it("restores both lists when the mutation fails", async () => {
    const archivedTrack = makeTrack();
    const { queryClient, wrapper } = setup([], [archivedTrack]);
    vi.mocked(unarchiveTrack).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useUnarchiveTrack(projectId), { wrapper });
    result.current.mutate("track-1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(["tracks", projectId])).toEqual([]);
    expect(
      queryClient.getQueryData(["tracks", projectId, "archived"]),
    ).toEqual([archivedTrack]);
  });
});
