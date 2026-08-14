import { describe, expect, it, vi } from "vitest";

const storagePut = vi.fn().mockResolvedValue({ key: "users/22/avatar.webp", url: "/manus-storage/users/22/avatar.webp" });
const where = vi.fn().mockResolvedValue(undefined);
const set = vi.fn(() => ({ where }));
const update = vi.fn(() => ({ set }));
const drizzle = vi.fn(() => ({ update }));

vi.mock("./storage", () => ({ storagePut }));
vi.mock("drizzle-orm/mysql2", () => ({ drizzle }));

process.env.DATABASE_URL = "mysql://test";
const { saveUserAvatar } = await import("./db");

describe("saveUserAvatar persistence", () => {
  it("uploads the image and persists only the storage URL", async () => {
    const result = await saveUserAvatar(22, "data:image/webp;base64,ZmFrZQ==");
    expect(storagePut).toHaveBeenCalledWith("users/22/avatar", Buffer.from("fake"), "image/webp");
    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ avatarUrl: "/manus-storage/users/22/avatar.webp" });
    expect(result).toEqual({ success: true, avatarUrl: "/manus-storage/users/22/avatar.webp" });
  });
});
