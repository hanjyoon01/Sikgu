import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      const data = await response.json();
      
      console.log("로그인 응답:", data);
      
      // Bearer token을 sessionStorage에 저장
      if (data.token) {
        sessionStorage.setItem("bearerToken", data.token);
        console.log("Bearer token 저장됨:", data.token);
      }
      
      return data;
    },
    onSuccess: async () => {
      console.log("로그인 성공, /auth/me 호출 시작");
      // 토큰 저장 후 /auth/me를 호출하여 사용자 정보 가져오기
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Bearer token 제거
      sessionStorage.removeItem("bearerToken");
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