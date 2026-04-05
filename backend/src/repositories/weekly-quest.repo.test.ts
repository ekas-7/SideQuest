import { describe, expect, test } from "bun:test";

describe("createWeeklyQuestsForUser", () => {
  test("executes inserts sequentially in deterministic slot order", async () => {
    process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
    const { createWeeklyQuestsForUser } = await import("./weekly-quest.repo.ts");

    const observedSlots: number[] = [];
    const completionOrder: number[] = [];
    let inFlight = 0;
    let sawConcurrentExecution = false;

    const executor = {
      query: async (_text: string, params?: unknown[]) => {
        const slot = Number((params ?? [])[2]);
        observedSlots.push(slot);

        inFlight += 1;
        if (inFlight > 1) {
          sawConcurrentExecution = true;
        }

        await new Promise((resolve) => setTimeout(resolve, 2));
        completionOrder.push(slot);
        inFlight -= 1;

        return { rows: [] };
      },
    };

    await createWeeklyQuestsForUser("user-1", "2026-04-05", [11, 22, 33], executor as never);

    expect(observedSlots).toEqual([1, 2, 3]);
    expect(completionOrder).toEqual([1, 2, 3]);
    expect(sawConcurrentExecution).toBe(false);
  });
});
