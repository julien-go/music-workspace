import { useSyncExternalStore } from "react";
import { Toaster as SonnerToaster } from "sonner";

const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Subscribes to the mobile media query without a useEffect — matchMedia is an
 * external store, so useSyncExternalStore keeps the value in sync on resize.
 */
function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(MOBILE_QUERY);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

/**
 * App-wide toast host. Mounted once at the root.
 * Dark theme + rich colors for error/success accents. Position adapts:
 * bottom-center on mobile (< 768px), bottom-right on desktop.
 */
export function Toaster() {
  const isMobile = useIsMobile();

  return (
    <SonnerToaster
      theme="dark"
      position={isMobile ? "bottom-center" : "bottom-right"}
      richColors
      closeButton
    />
  );
}
