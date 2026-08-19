const SESSION_COOKIE = "mf_customer";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type CustomerSession = {
  customerId: string;
  setCookie?: string;
};

export function getCustomerSession(request: Request): CustomerSession {
  const cookies = parseCookies(request.headers.get("cookie"));
  const existing = cookies[SESSION_COOKIE];

  if (existing && existing.startsWith("cus_")) {
    return { customerId: existing };
  }

  const customerId = `cus_${crypto.randomUUID()}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";

  return {
    customerId,
    setCookie: `${SESSION_COOKIE}=${customerId}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax; HttpOnly${secure}`,
  };
}

export function jsonWithSession(
  body: unknown,
  session: CustomerSession,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  if (session.setCookie) {
    headers.append("set-cookie", session.setCookie);
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf("=");
        if (separator === -1) return [cookie, ""];

        return [
          decodeURIComponent(cookie.slice(0, separator)),
          decodeURIComponent(cookie.slice(separator + 1)),
        ];
      }),
  );
}
