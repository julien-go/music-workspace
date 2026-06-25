import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.apiError = apiError;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
    credentials: "include",
  });

  if (response.status === 401) {
    useAuthStore.getState().clearUser();
    window.location.href = "/login";
    throw new ApiException({
      status: 401,
      error: "UNAUTHORIZED",
      message: "Session expired",
      errors: [],
    });
  }

  if (!response.ok) {
    const apiError: ApiError = await response.json();
    throw new ApiException(apiError);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
