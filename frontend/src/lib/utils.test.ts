import { describe, it, expect } from "vitest";
import { getFileExtension, stripFileExtension } from "./utils";

describe("getFileExtension", () => {
  it("returns the lowercased extension with leading dot", () => {
    expect(getFileExtension("demo.MP3")).toBe(".mp3");
    expect(getFileExtension("intro-v3.wav")).toBe(".wav");
  });

  it("uses the last dot for names with several dots", () => {
    expect(getFileExtension("my.master.take.flac")).toBe(".flac");
  });

  it("returns null when there is no usable extension", () => {
    expect(getFileExtension("noextension")).toBeNull();
    expect(getFileExtension("trailingdot.")).toBeNull();
    expect(getFileExtension(".dotfile")).toBeNull();
  });

  it("returns null for null/undefined/empty input", () => {
    expect(getFileExtension(null)).toBeNull();
    expect(getFileExtension(undefined)).toBeNull();
    expect(getFileExtension("")).toBeNull();
  });
});

describe("stripFileExtension", () => {
  it("removes the extension", () => {
    expect(stripFileExtension("demo.mp3")).toBe("demo");
    expect(stripFileExtension("intro-v3.wav")).toBe("intro-v3");
  });

  it("strips only the last extension", () => {
    expect(stripFileExtension("my.master.take.flac")).toBe("my.master.take");
  });

  it("returns the name unchanged when there is no extension", () => {
    expect(stripFileExtension("noextension")).toBe("noextension");
    expect(stripFileExtension(".dotfile")).toBe(".dotfile");
  });
});
