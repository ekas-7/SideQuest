import { HttpError } from "../utils/http.ts";

export function asString(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number; optional?: false },
): string;
export function asString(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; optional: true },
): string | undefined;
export function asString(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number; optional?: boolean },
) {
  if (value == null) {
    if (options?.optional) return undefined;
    throw new HttpError(400, "VALIDATION_ERROR", `${field} is required`);
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} must be a string`);
  }

  const normalized = value.trim();
  if (options?.min && normalized.length < options.min) {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} must be at least ${options.min} chars`);
  }

  if (options?.max && normalized.length > options.max) {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} must be at most ${options.max} chars`);
  }

  return normalized;
}

export function requireParam(value: string | undefined, field: string): string {
  if (!value) {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} route param is required`);
  }
  return value;
}

export function asBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} must be a boolean`);
  }
  return value;
}

export function asIntParam(value: string, field: string) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} must be an integer`);
  }
  return parsed;
}
