import type { Context } from "hono";
import { fail, ok } from "../utils/http.ts";
import { HttpError } from "../utils/http.ts";

export async function uploadProofPhotoController(c: Context) {
  try {
    const form = await c.req.formData();
    const file = form.get("file");

    if (!file || typeof file !== "object" || !("name" in file) || typeof file.name !== "string") {
      throw new HttpError(400, "VALIDATION_ERROR", "file is required");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const url = `https://example.local/proofs/${Date.now()}-${safeName}`;

    return c.json(ok({ url }));
  } catch (error) {
    const e = fail(error);
    return c.json(e.body, e.status as never);
  }
}
