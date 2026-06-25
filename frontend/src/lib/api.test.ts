import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchApi, ApiException } from "./api";
import { useAuthStore } from "@/store/authStore";

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
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await fetchApi("/test");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sets Content-Type json by default", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await fetchApi("/test");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("skips Content-Type for FormData", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await fetchApi("/test", { body: new FormData() });
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("returns undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const result = await fetchApi("/test");
    expect(result).toBeUndefined();
  });

  it("throws ApiException with error details on error response", async () => {
    const apiError = { status: 409, error: "CONFLICT", message: "Already exists", errors: [] };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(apiError), { status: 409 }),
    );

    try {
      await fetchApi("/test");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).apiError.status).toBe(409);
      expect((e as ApiException).apiError.message).toBe("Already exists");
    }
  });

  it("clears auth store and redirects on 401", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    const originalLocation = window.location.href;
    Object.defineProperty(window, "location", {
      value: { href: originalLocation },
      writable: true,
      configurable: true,
    });

    await expect(fetchApi("/test")).rejects.toThrow(ApiException);
    expect(useAuthStore.getState().user).toBeNull();
    expect(window.location.href).toBe("/login");
  });
});
