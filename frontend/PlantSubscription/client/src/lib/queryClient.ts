import { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    try {
      const errorData = JSON.parse(text);

      if (errorData.error === "insufficient_coins") {
        throw {
          error: "insufficient_coins",
          currentCoins: errorData.currentCoins,
          requiredCoins: errorData.requiredCoins,
          message: "보유 코인이 부족합니다."
        };
      }

      const errorMessage = errorData.error || errorData.message || text;
      throw new Error(errorMessage);
    } catch (e) {
      if (e instanceof Error && e.message) {
        throw e;
      }
      if (typeof e === 'object' && e !== null && 'error' in e) {
        throw e;
      }

      if (res.status === 400) {
        throw new Error("요청을 처리할 수 없습니다. 입력 내용을 확인해주세요.");
      } else if (res.status === 401) {
        throw new Error("로그인이 필요합니다.");
      } else if (res.status === 403) {
        throw new Error("권한이 없습니다.");
      } else if (res.status === 404) {
        throw new Error("요청한 정보를 찾을 수 없습니다.");
      } else if (res.status === 500) {
        throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } else {
        throw new Error("오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = sessionStorage.getItem("bearerToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: QueryKey }) => {
    const token = sessionStorage.getItem("bearerToken");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});