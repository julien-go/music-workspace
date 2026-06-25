export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}
