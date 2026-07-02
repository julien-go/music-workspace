import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toast host. Mounted once at the root.
 * Dark theme + bottom-right to match the design system; richColors gives
 * error/success their own accent backgrounds.
 */
export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
    />
  );
}
