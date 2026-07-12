const UPLOAD_MARKER = "/upload/";

/**
 * Inserts a transformation segment into a Cloudinary delivery URL. Non-Cloudinary
 * URLs (no `/upload/`) are returned untouched, so callers can pass any src safely.
 */
function cldTransform(url: string, transform: string): string {
  const i = url.indexOf(UPLOAD_MARKER);
  if (i === -1) return url;
  const cut = i + UPLOAD_MARKER.length;
  return `${url.slice(0, cut)}${transform}/${url.slice(cut)}`;
}

/**
 * Square, cropped thumbnail at the display size (×2 for retina) with automatic
 * format and quality — so a 2000px cover isn't shipped for a 48px avatar.
 */
export function cldThumb(url: string, size: number): string {
  return cldTransform(url, `f_auto,q_auto,c_fill,g_auto,w_${size * 2},h_${size * 2}`);
}

/** Format/quality optimization only, no resize — for the full-size lightbox view. */
export function cldOptimized(url: string): string {
  return cldTransform(url, "f_auto,q_auto");
}
