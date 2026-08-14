import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeOAuthState, OAUTH_STATE_COOKIE, COOKIE_NAME } from "@shared/const";

const upsertUser = vi.fn();
const exchangeCodeForToken = vi.fn();
const getUserInfo = vi.fn();
const createSessionToken = vi.fn();

vi.mock("./db", () => ({ upsertUser }));
vi.mock("./_core/sdk", () => ({ sdk: { exchangeCodeForToken, getUserInfo, createSessionToken } }));

const originalAppId = process.env.VITE_APP_ID;
const originalOAuthUrl = process.env.OAUTH_SERVER_URL;

afterEach(() => {
  vi.clearAllMocks();
  if (originalAppId === undefined) delete process.env.VITE_APP_ID;
  else process.env.VITE_APP_ID = originalAppId;
  if (originalOAuthUrl === undefined) delete process.env.OAUTH_SERVER_URL;
  else process.env.OAUTH_SERVER_URL = originalOAuthUrl;
  vi.resetModules();
});

describe("OAuth callback", () => {
  it("creates a session after validating state and redirects home", async () => {
    process.env.VITE_APP_ID = "sdebr-test-app";
    process.env.OAUTH_SERVER_URL = "https://api.manus.im";

    const { registerOAuthRoutes } = await import("./_core/oauth");
    const routes = new Map<string, (req: any, res: any) => Promise<void>>();
    registerOAuthRoutes({
      get: (path: string, handler: (req: any, res: any) => Promise<void>) => routes.set(path, handler),
    } as any);

    const nonce = "nonce-callback-test";
    const state = encodeOAuthState({ nonce, redirectUri: "https://web-sdebr.example.com/api/oauth/callback" });
    exchangeCodeForToken.mockResolvedValue({ accessToken: "access-token" });
    getUserInfo.mockResolvedValue({ openId: "user-123", name: "Usuário SDEBR", email: "user@example.com", loginMethod: "email" });
    createSessionToken.mockResolvedValue("session-token");

    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    let redirectStatus = 0;
    let redirectLocation = "";
    const handler = routes.get("/api/oauth/callback");
    await handler?.(
      {
        query: { code: "oauth-code", state },
        headers: { cookie: `${OAUTH_STATE_COOKIE}=${nonce}`, "x-forwarded-proto": "https" },
        protocol: "http",
      },
      {
        clearCookie: vi.fn(),
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
        redirect: (status: number, location: string) => { redirectStatus = status; redirectLocation = location; },
        status: () => ({ json: vi.fn() }),
      },
    );

    expect(exchangeCodeForToken).toHaveBeenCalledWith("oauth-code", state);
    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "user-123", email: "user@example.com" }));
    expect(createSessionToken).toHaveBeenCalledWith("user-123", expect.objectContaining({ name: "Usuário SDEBR" }));
    expect(cookies).toContainEqual(expect.objectContaining({ name: COOKIE_NAME, value: "session-token" }));
    expect(cookies.find(cookie => cookie.name === COOKIE_NAME)?.options).toMatchObject({ secure: true, sameSite: "none" });
    expect(redirectStatus).toBe(302);
    expect(redirectLocation).toBe("/");
  });
});
