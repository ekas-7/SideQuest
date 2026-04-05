import type { Context } from "hono";

import { HttpError } from "../utils/http-error.ts";

export const errorMiddleware = (error: Error, c: Context) => {
  if (error instanceof HttpError) {
    return c.json(
      {
        error: {
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode as 400 },
    );
  }

  console.error(error);
  return c.json(
    {
      error: {
        message: "Internal server error",
      },
    },
    500,
  );
};
