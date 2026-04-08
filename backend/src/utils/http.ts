export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T) {
  return { data, error: null } as const;
}

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    } as const;
  }

  return {
    status: 500,
    body: {
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
      },
    },
  } as const;
}
