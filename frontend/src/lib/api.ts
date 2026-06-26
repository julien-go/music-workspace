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
      message: "Impossible de joindre le serveur. Vérifiez votre connexion.",
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
        message: "Le serveur est inaccessible. Réessayez dans un instant.",
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
