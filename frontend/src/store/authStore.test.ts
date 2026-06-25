import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("starts with no user", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setUser stores the user", () => {
    const user = { id: "1", email: "a@b.com", username: "alice" };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("clearUser resets to null", () => {
    useAuthStore.getState().setUser({ id: "1", email: "a@b.com", username: "alice" });
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
