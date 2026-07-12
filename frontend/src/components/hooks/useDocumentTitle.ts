import { useEffect } from "react";

const SUFFIX = "Music Workspace";

/**
 * Sets the browser tab title. Pass the page-specific part (e.g. a project name)
 * and the app name is appended; pass nothing while data is still loading to keep
 * the bare app name. Resets to the bare app name on unmount, so a route that
 * doesn't set its own title never inherits the previous page's.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = SUFFIX;
    };
  }, [title]);
}
