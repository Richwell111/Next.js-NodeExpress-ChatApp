import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createBrowserApiClient } from "@/lib/api-client";

/**
 * A custom hook that returns a memoized Axios instance.
 * It automatically handles authentication by injecting the Clerk Bearer token
 * into every request made through this client.
 */
export function useApi() {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    return createBrowserApiClient(getToken);
  }, [getToken]);

  return apiClient;
}
