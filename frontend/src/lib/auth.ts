import { apiFetch } from "./api";

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
}

export async function register(
  data: RegisterRequest
) {
  return apiFetch(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function login(
  data: LoginRequest
): Promise<TokenResponse> {
  return apiFetch(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}


export async function getCurrentUser(): Promise<User> {
  return apiFetch("/api/auth/me");
}

export async function logout() {
  return apiFetch(
    "/api/auth/logout",
    {
      method: "POST",
    }
  );
}