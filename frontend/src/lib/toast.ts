import { toast } from "sonner";

/**
 * The single entry point for toasts. Components must call these helpers rather
 * than importing `sonner` directly, so styling and behavior stay centralized.
 */
export function toastError(message: string) {
  toast.error(message);
}

export function toastSuccess(message: string) {
  toast.success(message);
}
