import { describe, expect, it, vi } from "vitest";

const saveUserAvatar = vi.fn().mockResolvedValue({ success: true, avatarUrl: "/manus-storage/users/1/avatar_abc.webp" });
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, saveUserAvatar };
});

const { appRouter } = await import("./routers");

describe("successful profile avatar upload", () => {
  it("returns the persisted storage URL for the authenticated user", async () => {
    const user = { id: 1, openId: "avatar-success", role: "user", name: "User", email: "user@example.com", loginMethod: "test", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), preferences: null, avatarUrl: null } as const;
    const caller = appRouter.createCaller({ user, req: {} as any, res: {} as any });
    const dataUrl = "data:image/webp;base64,ZmFrZQ==";
    await expect(caller.profile.avatar({ dataUrl })).resolves.toEqual({ success: true, avatarUrl: "/manus-storage/users/1/avatar_abc.webp" });
    expect(saveUserAvatar).toHaveBeenCalledWith(1, dataUrl);
  });
});
