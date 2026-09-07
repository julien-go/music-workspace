import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { login, register, fetchMe } from "./api";
import { useAuthStore } from "@/store/authStore";
import { router } from "@/routes";

// A 401 on these endpoints means bad credentials / anonymous visitor, not an
// expired session, so the fetch wrapper must not clear auth or redirect.
describe("auth api — skipAuthRedirect", () => {
  const user = { id: "1", email: "a@b.com", username: "alice" };

  beforeEach(() => {
    useAuthStore.setState({ user });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function respond401() {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ status: 401, error: "UNAUTHORIZED", message: "Bad", errors: [] }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );
  }

  it("login does not clear auth or redirect on 401", async () => {
    respond401();
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(undefined as never);

    await expect(login({ email: "a@b.com", password: "wrong" })).rejects.toThrow();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("register does not clear auth or redirect on 401", async () => {
    respond401();
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(undefined as never);

    await expect(
      register({ email: "a@b.com", username: "alice", password: "x" }),
    ).rejects.toThrow();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("fetchMe stays silent on 401 (anonymous probe, no redirect)", async () => {
    respond401();
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(undefined as never);

    await expect(fetchMe()).rejects.toThrow();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toEqual(user);
  });
});
