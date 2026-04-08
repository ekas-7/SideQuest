import type { Context } from "hono";
import { ok } from "../utils/http.ts";

export async function getHealthController(c: Context) {
  return c.json(ok({ status: "ok" }));
}
