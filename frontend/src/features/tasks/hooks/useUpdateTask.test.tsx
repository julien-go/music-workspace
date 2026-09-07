import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateTask } from "./useUpdateTask";
import { updateTask } from "../api";
import type { TaskResponse } from "../types";

vi.mock("../api", () => ({
  updateTask: vi.fn(),
}));

const projectId = "project-1";

function makeTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: "task-1",
    title: "Record guitar",
    description: null,
    status: "TODO",
    createdBy: { id: "user-1", username: "john" },
    assignedTo: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(["tasks", projectId], [makeTask()]);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useUpdateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies the status optimistically before the server responds", async () => {
    const { queryClient, wrapper } = setup();
    vi.mocked(updateTask).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUpdateTask(projectId), { wrapper });
    result.current.mutate({ taskId: "task-1", data: { status: "DOING" } });

    await waitFor(() => {
      const tasks = queryClient.getQueryData<TaskResponse[]>(["tasks", projectId]);
      expect(tasks?.[0].status).toBe("DOING");
    });
  });

  it("invalidates the tasks query once settled", async () => {
    const { queryClient, wrapper } = setup();
    vi.mocked(updateTask).mockResolvedValue(makeTask({ status: "DOING" }));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateTask(projectId), { wrapper });
    result.current.mutate({ taskId: "task-1", data: { status: "DOING" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["tasks", projectId] });
  });

  it("rolls back the cache when the mutation fails", async () => {
    const { queryClient, wrapper } = setup();
    vi.mocked(updateTask).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useUpdateTask(projectId), { wrapper });
    result.current.mutate({ taskId: "task-1", data: { status: "DONE" } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const tasks = queryClient.getQueryData<TaskResponse[]>(["tasks", projectId]);
    expect(tasks?.[0].status).toBe("TODO");
  });
});
