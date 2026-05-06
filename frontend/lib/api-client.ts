import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosInstance,
} from "axios";

/**
 * Creates a configured Axios instance for the browser.
 * It automatically handles the base URL and injects the authentication token
 * into the Authorization header for every request.
 */
export function createBrowserApiClient(
  getToken: () => Promise<string | null>
): AxiosInstance {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000",
    withCredentials: false,
  });

  /**
   * Request Interceptor: Runs before every request leaves the client.
   * It fetches the latest auth token and adds it to the headers.
   */
  client.interceptors.request.use(async (config) => {
    const token = await getToken();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  /**
   * Response Interceptor: Standardizes how the application handles errors.
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Return the error so it can be handled by the calling logic
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Standard GET request wrapper. 
 * Automatically unwraps the { data: T } structure from the backend.
 */
export async function apiGet<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await client.get<{ data: T }>(url, config);

  return response.data.data;
}

/**
 * Standard PATCH request wrapper.
 * Used for partial updates to resources.
 */
export async function apiPatch<TBody, TResponse>(
  client: AxiosInstance,
  url: string,
  body: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await client.patch<{ data: TResponse }>(url, body, config);

  return res.data.data;
}

/**
 * Standard POST request wrapper.
 * Used for creating new resources.
 */
export async function apiPost<TBody, TResponse>(
  client: AxiosInstance,
  url: string,
  body: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await client.post<{ data: TResponse }>(url, body, config);

  return res.data.data;
}