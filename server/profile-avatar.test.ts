import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("profile avatar", () => {
  it("rejects an invalid image payload", async () => {
    const ctx = { user: { id: 1, openId: "avatar-test", role: "user", name: "User", email: "user@example.com", loginMethod: "test", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), preferences: null, avatarUrl: null }, req: {} as any, res: {} as any } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.avatar({ dataUrl: "data:text/plain;base64,ZmFrZQ==" })).rejects.toThrow("Formato de imagem inválido");
  });

  it("rejects avatar upload without authentication", async () => {
    const ctx = { user: null, req: {} as any, res: {} as any } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.avatar({ dataUrl: "data:image/png;base64,ZmFrZQ==" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
