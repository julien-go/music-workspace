import { describe, it, expect } from "vitest";
import { cldThumb, cldOptimized } from "./cloudinary";

const CLD = "https://res.cloudinary.com/demo/image/upload/v123/covers/pic.jpg";

describe("cldThumb", () => {
  it("inserts a square, retina-sized transform after /upload/", () => {
    expect(cldThumb(CLD, 48)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_auto,w_96,h_96/v123/covers/pic.jpg",
    );
  });

  it("leaves non-Cloudinary URLs untouched", () => {
    expect(cldThumb("https://example.com/pic.jpg", 48)).toBe("https://example.com/pic.jpg");
  });
});

describe("cldOptimized", () => {
  it("applies format/quality only, no resize", () => {
    expect(cldOptimized(CLD)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/covers/pic.jpg",
    );
  });
});
