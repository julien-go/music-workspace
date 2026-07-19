import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShareProjectButton } from "./ShareProjectButton";
import { updateProject } from "../api";
import { toastSuccess } from "@/lib/toast";
import type { ProjectResponse } from "../types";

vi.mock("../api", () => ({
  updateProject: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

// @/lib/api (used by the component for describeError) imports the app router.
vi.mock("@/routes", () => ({
  router: { navigate: vi.fn() },
}));

const project: ProjectResponse = {
  id: "proj-1",
  name: "My Album",
  description: null,
  coverUrl: null,
  isPublic: false,
  owner: { id: "user-1", username: "john" },
  currentUserRole: "OWNER",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function renderButton(overrides: Partial<ProjectResponse> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ShareProjectButton project={{ ...project, ...overrides }} />
    </QueryClientProvider>,
  );
}

const publicUrl = `${window.location.origin}/p/proj-1`;

describe("ShareProjectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows only the 'make public' action when the project is private", () => {
    renderButton({ isPublic: false });

    expect(screen.getByRole("button", { name: "Rendre public" })).toBeInTheDocument();
    expect(screen.queryByText(publicUrl)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rendre privé" })).not.toBeInTheDocument();
  });

  it("makes the project public when clicking 'Rendre public'", async () => {
    vi.mocked(updateProject).mockResolvedValue({ ...project, isPublic: true });
    renderButton({ isPublic: false });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Rendre public" }));

    expect(updateProject).toHaveBeenCalledWith("proj-1", { isPublic: true });
  });

  it("shows the public URL and the 'make private' action when public", () => {
    renderButton({ isPublic: true });

    expect(screen.getByText(publicUrl)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rendre privé" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rendre public" })).not.toBeInTheDocument();
  });

  it("copies the public URL and toasts success", async () => {
    renderButton({ isPublic: true });
    // userEvent installs its own clipboard stub; read it back to assert content.
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Copier le lien public" }));

    await vi.waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith("Lien copié");
    });
    expect(await navigator.clipboard.readText()).toBe(publicUrl);
  });

  it("makes the project private when clicking 'Rendre privé'", async () => {
    vi.mocked(updateProject).mockResolvedValue({ ...project, isPublic: false });
    renderButton({ isPublic: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Rendre privé" }));

    expect(updateProject).toHaveBeenCalledWith("proj-1", { isPublic: false });
  });
});
