import { describe, expect, it } from "vitest";

describe("application title configuration", () => {
  it("uses SDEBR as the official application title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("SDEBR");
  });
});
