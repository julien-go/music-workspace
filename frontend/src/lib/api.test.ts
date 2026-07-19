import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchApi, ApiException, describeError, isUnauthorizedError } from "./api";
import { useAuthStore } from "@/store/authStore";
import { router } from "@/routes";

describe("fetchApi", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: "1", email: "a@b.com", username: "alice" } });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ name: "test" }), { status: 200 }),
    );

    const result = await fetchApi<{ name: string }>("/test");
    expect(result).toEqual({ name: "test" });
  });

  it("sends credentials include", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await fetchApi("/test");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sets Content-Type json by default", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await fetchApi("/test");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("skips Content-Type for FormData", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await fetchApi("/test", { body: new FormData() });
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("returns undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const result = await fetchApi("/test");
    expect(result).toBeUndefined();
  });

  it("throws ApiException with error details on error response", async () => {
    const apiError = { status: 409, error: "CONFLICT", message: "Already exists", errors: [] };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(apiError), { status: 409 }));

    try {
      await fetchApi("/test");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).apiError.status).toBe(409);
      expect((e as ApiException).apiError.message).toBe("Already exists");
    }
  });

  it("clears auth store and navigates to /login on 401", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(undefined as never);

    await expect(fetchApi("/test")).rejects.toThrow(ApiException);
    expect(useAuthStore.getState().user).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith({ to: "/login" });
  });

  it("skips 401 redirect when skipAuthRedirect is true", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 401,
          error: "UNAUTHORIZED",
          message: "Bad credentials",
          errors: [],
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(undefined as never);

    await expect(fetchApi("/test", { skipAuthRedirect: true })).rejects.toThrow(ApiException);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("handles non-JSON error body gracefully", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", { status: 502 }),
    );

    try {
      await fetchApi("/test");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).apiError.status).toBe(502);
    }
  });
});

function apiError(status: number, message = "msg"): ApiException {
  return new ApiException({ status, error: "ERR", message, errors: [] });
}

describe("isUnauthorizedError", () => {
  it("is true only for a 401 ApiException", () => {
    expect(isUnauthorizedError(apiError(401))).toBe(true);
    expect(isUnauthorizedError(apiError(403))).toBe(false);
    expect(isUnauthorizedError(new Error("boom"))).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
  });
});

describe("describeError", () => {
  it("maps a connectivity failure (status 0) to a network message", () => {
    expect(describeError(apiError(0), "fallback")).toContain("Connexion au serveur impossible");
  });

  it("surfaces the rate-limit message on 429 instead of the fallback", () => {
    expect(
      describeError(apiError(429, "Trop de tentatives, réessaie dans un instant."), "fallback"),
    ).toBe("Trop de tentatives, réessaie dans un instant.");
  });

  it("falls back to a default rate-limit message when the 429 has none", () => {
    expect(describeError(apiError(429, ""), "fallback")).toBe(
      "Trop de tentatives, réessaie dans un instant.",
    );
  });

  it("uses a generic message for 5xx errors", () => {
    expect(describeError(apiError(503), "fallback")).toContain("momentanément indisponible");
  });

  it("defers to the caller fallback for 4xx and non-ApiException errors", () => {
    expect(describeError(apiError(422), "fallback")).toBe("fallback");
    expect(describeError(new Error("boom"), "fallback")).toBe("fallback");
  });
});
