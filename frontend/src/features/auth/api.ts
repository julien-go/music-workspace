import { fetchApi } from "@/lib/api";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "./types";

export function login(data: LoginRequest) {
  return fetchApi<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuthRedirect: true,
  });
}

export function register(data: RegisterRequest) {
  return fetchApi<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuthRedirect: true,
  });
}

export function fetchMe() {
  // Session rehydration is a silent probe: an anonymous visitor on a public
  // page must not be bounced to /login — route guards handle protected pages.
  return fetchApi<UserResponse>("/auth/me", { skipAuthRedirect: true });
}

export function logout() {
  return fetchApi<void>("/auth/logout", { method: "POST" });
}
