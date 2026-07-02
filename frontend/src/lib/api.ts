import { useAuthStore } from "@/store/authStore";
import { router } from "@/routes";
import type { ApiError } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.apiError = apiError;
  }
}

/**
 * True when an error is a 401. Callers use this to skip user-facing feedback on
 * unauthenticated failures — the fetch wrapper already clears auth and redirects.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiException && error.apiError.status === 401;
}

/**
 * Maps an error to a plain-French, user-facing message — never an HTTP code or
 * backend/technical wording. Connectivity and server-side failures get a generic
 * message; for client-side failures we defer to the caller's action-specific
 * `fallback` (e.g. "Échec de l'upload, réessaie").
 */
export function describeError(error: unknown, fallback: string): string {
  if (error instanceof ApiException) {
    const { status } = error.apiError;
    if (status === 0) return "Connexion au serveur impossible. Vérifie ta connexion internet.";
    if (status >= 500) return "Le service est momentanément indisponible. Réessaie dans un instant.";
  }
  return fallback;
}

interface FetchApiOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: FetchApiOptions,
): Promise<T> {
  const { skipAuthRedirect, ...requestInit } = options ?? {};
  const headers: Record<string, string> = {};

  if (!(requestInit.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestInit,
      headers: { ...headers, ...(requestInit.headers as Record<string, string>) },
      credentials: "include",
    });
  } catch {
    throw new ApiException({
      status: 0,
      error: "NETWORK_ERROR",
      message: "Le serveur est momentanément indisponible.",
      errors: [],
    });
  }

  if (response.status === 401 && !skipAuthRedirect) {
    useAuthStore.getState().clearUser();
    router.navigate({ to: "/login" });
    throw new ApiException({
      status: 401,
      error: "UNAUTHORIZED",
      message: "Session expirée",
      errors: [],
    });
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new ApiException({
        status: response.status,
        error: "SERVICE_UNAVAILABLE",
        message: "Le serveur est momentanément indisponible.",
        errors: [],
      });
    }
    try {
      const apiError: ApiError = await response.json();
      throw new ApiException(apiError);
    } catch (e) {
      if (e instanceof ApiException) throw e;
      throw new ApiException({
        status: response.status,
        error: response.statusText || "ERROR",
        message: "Une erreur inattendue est survenue.",
        errors: [],
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
