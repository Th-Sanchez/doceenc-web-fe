import type { components } from "./schema";

/** RFC 9457 problem details as returned by the API. The "code" is stable and drives the UI text. */
export type Problem = components["schemas"]["ProblemDetail"];

export class ApiError extends Error {
  readonly status: number;
  readonly problem: Problem | undefined;

  constructor(status: number, problem?: Problem) {
    super(problem?.detail ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  get code(): string | undefined {
    return this.problem?.code;
  }
}

/** The error body is parsed JSON for problem responses, but may be plain text for unexpected ones. */
export function toApiError(status: number, body: unknown): ApiError {
  const problem = typeof body === "object" && body !== null ? (body as Problem) : undefined;
  return new ApiError(status, problem);
}
