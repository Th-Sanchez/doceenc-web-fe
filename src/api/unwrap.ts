import { toApiError } from "./problem";

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Turns an openapi-fetch result into its data, or throws an ApiError built from the problem body. */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) {
    throw toApiError(response.status, error);
  }
  return data as T;
}