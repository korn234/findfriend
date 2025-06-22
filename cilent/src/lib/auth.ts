import { apiRequest } from "./queryClient";
import type { LoginData, RegisterData, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "./queryClient";

const TOKEN_KEY = "auth_token";

export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },

  login: async (data: LoginData): Promise<{ token: string; user: User }> => {
    const response = await apiRequest("POST", "/api/login", data);
    const result = await response.json();
    auth.setToken(result.token);
    return result;
  },

  register: async (data: RegisterData): Promise<{ token: string; user: User }> => {
    const response = await apiRequest("POST", "/api/register", data);
    const result = await response.json();
    auth.setToken(result.token);
    return result;
  },

  logout: (): void => {
    auth.removeToken();
    window.location.href = "/login";
  },

  getCurrentUser: async (): Promise<User> => {
    const token = auth.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch("/api/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return response.json();
  },
};

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: auth.isAuthenticated(),
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: auth.isAuthenticated(),
    error,
  };
}
