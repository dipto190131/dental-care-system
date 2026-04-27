import { apiRequest } from "./queryClient";

export async function login(email: string, password: string) {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  return res.json();
}

export async function register(data: Record<string, any>) {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
}

export async function logout() {
  await apiRequest("POST", "/api/auth/logout", {});
}

export async function getMe() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}
