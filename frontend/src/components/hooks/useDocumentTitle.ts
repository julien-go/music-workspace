import { useEffect } from "react";

const SUFFIX = "Music Workspace";

/**
 * Sets the browser tab title. Pass the page-specific part (e.g. a project name)
 * and the app name is appended; pass nothing while data is still loading to keep
 * the bare app name.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
  }, [title]);
}
