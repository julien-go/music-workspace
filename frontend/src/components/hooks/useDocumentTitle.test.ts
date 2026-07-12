import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useDocumentTitle } from "./useDocumentTitle";

describe("useDocumentTitle", () => {
  it("appends the app name to the page title", () => {
    renderHook(() => useDocumentTitle("Mon projet"));
    expect(document.title).toBe("Mon projet · Music Workspace");
  });

  it("shows the bare app name while loading (no title)", () => {
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe("Music Workspace");
  });

  it("resets to the bare app name on unmount", () => {
    const { unmount } = renderHook(() => useDocumentTitle("Mon projet"));
    expect(document.title).toBe("Mon projet · Music Workspace");
    unmount();
    expect(document.title).toBe("Music Workspace");
  });
});
