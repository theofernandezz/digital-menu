const FALLBACK_ORIGIN = "http://localhost:3000";

function firstHeaderValue(value: string | null): string | undefined {
  const first = value?.split(",")[0]?.trim();
  return first ? first : undefined;
}

function isLocalHost(host: string): boolean {
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getRequestOrigin(headersList: Pick<Headers, "get">): string {
  const host = firstHeaderValue(headersList.get("x-forwarded-host")) ?? firstHeaderValue(headersList.get("host"));
  if (!host) return FALLBACK_ORIGIN;

  const proto = firstHeaderValue(headersList.get("x-forwarded-proto")) ?? (isLocalHost(host) ? "http" : "https");
  return `${proto}://${host}`;
}

export function buildTableLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/t/${encodeURIComponent(token)}`;
}
