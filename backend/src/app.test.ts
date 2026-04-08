import { describe, expect, test } from "bun:test";
import app from "./app.ts";

describe("backend smoke", () => {
  test("GET /health returns ok", async () => {
    const res = await app.request("http://localhost/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { status: string } };
    expect(body.data.status).toBe("ok");
  });
});
