import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
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
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
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
      // Optimize caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      // Smart retry strategy
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.message?.includes('4') && !error?.message?.includes('408') && !error?.message?.includes('429')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.message?.includes('4')) {
          return false;
        }
        return failureCount < 1;
      },
      // Add optimistic updates context
      onMutate: () => {
        // Can be overridden per mutation
      },
    },
  },
});

// Add query invalidation helpers
export const invalidateQueries = {
  matches: () => queryClient.invalidateQueries({ queryKey: ["/api/matches"] }),
  messages: (matchId?: number) => 
    matchId 
      ? queryClient.invalidateQueries({ queryKey: ["/api/messages", matchId] })
      : queryClient.invalidateQueries({ queryKey: ["/api/messages"] }),
  potentialMatches: () => queryClient.invalidateQueries({ queryKey: ["/api/potential-matches"] }),
  user: () => queryClient.invalidateQueries({ queryKey: ["/api/me"] }),
};

// Add prefetch helpers for better UX
export const prefetchQueries = {
  matches: () => queryClient.prefetchQuery({
    queryKey: ["/api/matches"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  }),
  potentialMatches: () => queryClient.prefetchQuery({
    queryKey: ["/api/potential-matches"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 1 * 60 * 1000, // 1 minute
  }),
};
