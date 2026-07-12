import { toast } from "sonner";
import { describeError, isUnauthorizedError } from "./api";

export function toastError(message: string) {
  toast.error(message);
}

export function toastSuccess(message: string) {
  toast.success(message);
}

/**
 * Toasts a user-facing message for a failed mutation, staying silent on 401 —
 * the fetch wrapper already clears auth and redirects, so a toast would be noise.
 */
export function notifyError(error: unknown, fallback: string) {
  if (!isUnauthorizedError(error)) {
    toastError(describeError(error, fallback));
  }
}
