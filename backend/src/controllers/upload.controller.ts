import { join } from "node:path";

import type { Context } from "hono";

import { UPLOAD_DIR } from "../paths.ts";
import { HttpError } from "../utils/http-error.ts";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const extForMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function resolveImageMime(file: File): string {
  const fromType = (file.type || "").toLowerCase().trim();
  if (fromType && fromType !== "application/octet-stream") {
    return fromType;
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  if (name.endsWith(".gif")) {
    return "image/gif";
  }

  return fromType;
}

export const uploadProofPhotoController = async (c: Context) => {
  const body = await c.req.parseBody();
  const entry = body.file;

  if (!(entry instanceof File)) {
    throw new HttpError(400, "Expected multipart field \"file\" with an image.");
  }

  if (entry.size === 0) {
    throw new HttpError(400, "Image file is empty.");
  }

  if (entry.size > MAX_BYTES) {
    throw new HttpError(400, "Image must be 5MB or smaller.");
  }

  const mime = resolveImageMime(entry);
  if (!ALLOWED_MIME.has(mime)) {
    throw new HttpError(400, "Only JPEG, PNG, WebP, and GIF images are allowed.");
  }

  const ext = extForMime[mime];
  if (!ext) {
    throw new HttpError(400, "Unsupported image type.");
  }

  const id = crypto.randomUUID();
  const filename = `${id}${ext}`;
  const path = join(UPLOAD_DIR, filename);

  await Bun.write(path, new Uint8Array(await entry.arrayBuffer()));

  const publicBase =
    (process.env.PUBLIC_BASE_URL ?? "").trim() || new URL(c.req.url).origin;
  const url = `${publicBase.replace(/\/$/, "")}/uploads/${filename}`;

  return c.json({ url });
};
