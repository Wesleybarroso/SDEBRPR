import { afterEach, describe, expect, it, vi } from "vitest";

const originalAppId = process.env.VITE_APP_ID;
const originalOAuthUrl = process.env.OAUTH_SERVER_URL;
const originalPortalUrl = process.env.VITE_OAUTH_PORTAL_URL;

afterEach(() => {
  if (originalAppId === undefined) delete process.env.VITE_APP_ID;
  else process.env.VITE_APP_ID = originalAppId;
  if (originalOAuthUrl === undefined) delete process.env.OAUTH_SERVER_URL;
  else process.env.OAUTH_SERVER_URL = originalOAuthUrl;
  if (originalPortalUrl === undefined) delete process.env.VITE_OAUTH_PORTAL_URL;
  else process.env.VITE_OAUTH_PORTAL_URL = originalPortalUrl;
  vi.resetModules();
});

describe("OAuth start route", () => {
  it("builds a public callback redirect and secure nonce cookie", async () => {
    process.env.VITE_APP_ID = "sdebr-test-app";
    process.env.OAUTH_SERVER_URL = "https://api.manus.im";
    process.env.VITE_OAUTH_PORTAL_URL = "https://oauth.sdebr.example.com";

    const { registerOAuthRoutes } = await import("./_core/oauth");
    const routes = new Map<string, (req: any, res: any) => void>();
    registerOAuthRoutes({
      get: (path: string, handler: (req: any, res: any) => void) => routes.set(path, handler),
    } as any);

    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    let redirectUrl = "";
    routes.get("/api/oauth/start")?.(
      { protocol: "http", headers: { "x-forwarded-proto": "https" }, get: () => "web-sdebr.example.com" },
      {
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
        redirect: (_status: number, url: string) => { redirectUrl = url; },
      },
    );

    const parsed = new URL(redirectUrl);
    expect(parsed.origin).toBe("https://oauth.sdebr.example.com");
    expect(parsed.pathname).toBe("/app-auth");
    expect(parsed.searchParams.get("appId")).toBe("sdebr-test-app");
    expect(parsed.searchParams.get("redirectUri")).toBe("https://web-sdebr.example.com/api/oauth/callback");
    expect(parsed.searchParams.get("state")).toBeTruthy();
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "none", path: "/" });
  });
});
