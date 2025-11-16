
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface User {
  id: string;
  username: string;
  coins: number;
  address: string | null;
  phone: string | null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "로그인에 실패했습니다.");
      }

      const token = await response.text();
      
      // 토큰을 localStorage에 저장
      localStorage.setItem('authToken', token);
      
      // 토큰으로 사용자 정보 가져오기
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!userResponse.ok) {
        throw new Error("사용자 정보를 가져올 수 없습니다.");
      }

      return userResponse.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // 토큰 제거
      localStorage.removeItem('authToken');

      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data to prevent data leakage between users
      queryClient.clear();
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
}
