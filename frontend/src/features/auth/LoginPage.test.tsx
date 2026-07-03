import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";
import { login } from "./api";
import { ApiException } from "@/lib/api";

vi.mock("./api", () => ({
  login: vi.fn(),
}));

// LoginPage only needs Link and useNavigate — stub the router instead of
// building a full route tree for a single-page test.
const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  useNavigate: () => navigate,
}));

// @/lib/api imports the app router from @/routes, whose route definitions
// would blow up under the partial router mock above.
vi.mock("@/routes", () => ({
  router: { navigate: vi.fn() },
}));

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors instead of calling the API on empty submit", async () => {
    renderLoginPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Must be a valid email")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("shows a French error on rejected credentials", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiException({
        status: 401,
        error: "UNAUTHORIZED",
        message: "Invalid email or password",
        errors: [],
      }),
    );
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByText("Email ou mot de passe incorrect."),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates to the dashboard on success", async () => {
    vi.mocked(login).mockResolvedValue({
      user: { id: "user-1", email: "john@example.com", username: "john" },
    });
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Correct-p4ssword!");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" });
    });
  });
});
