import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("protected access gate", () => {
  it("rejects dashboard access without an authenticated user", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.metrics()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
