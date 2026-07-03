import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReorderTracks } from "./useReorderTracks";
import { reorderTracks } from "../api";

vi.mock("../api", () => ({
  reorderTracks: vi.fn(),
}));

const projectId = "project-1";

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper };
}

describe("useReorderTracks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the new track order to the API", async () => {
    const { wrapper } = setup();
    vi.mocked(reorderTracks).mockResolvedValue([]);

    const { result } = renderHook(() => useReorderTracks(projectId), { wrapper });
    result.current.mutate({ trackIds: ["track-2", "track-1"] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reorderTracks).toHaveBeenCalledWith(projectId, ["track-2", "track-1"]);
  });

  it("exposes the error so the caller can roll back its local order", async () => {
    const { wrapper } = setup();
    vi.mocked(reorderTracks).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useReorderTracks(projectId), { wrapper });
    result.current.mutate({ trackIds: ["track-1"] });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
