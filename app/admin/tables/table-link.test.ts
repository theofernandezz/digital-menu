import { describe, expect, it } from "vitest";
import { buildTableLink, getRequestOrigin } from "@/app/admin/tables/table-link";

function headersOf(values: Record<string, string>): Pick<Headers, "get"> {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe("getRequestOrigin", () => {
  it("uses http for localhost with a port", () => {
    expect(getRequestOrigin(headersOf({ host: "localhost:3000" }))).toBe("http://localhost:3000");
  });

  it("uses http for 127.0.0.1 and for localhost without a port", () => {
    expect(getRequestOrigin(headersOf({ host: "127.0.0.1:3000" }))).toBe("http://127.0.0.1:3000");
    expect(getRequestOrigin(headersOf({ host: "localhost" }))).toBe("http://localhost");
  });

  it("uses https for a production host", () => {
    expect(getRequestOrigin(headersOf({ host: "menu.example.com" }))).toBe("https://menu.example.com");
  });

  it("prefers forwarded headers over host", () => {
    const origin = getRequestOrigin(
      headersOf({
        host: "internal:3000",
        "x-forwarded-host": "menu.example.com",
        "x-forwarded-proto": "https",
      }),
    );
    expect(origin).toBe("https://menu.example.com");
  });

  it("takes the first value of comma-separated forwarded headers", () => {
    const origin = getRequestOrigin(
      headersOf({
        "x-forwarded-host": " menu.example.com , proxy.internal",
        "x-forwarded-proto": "https, http",
      }),
    );
    expect(origin).toBe("https://menu.example.com");
  });

  it("falls back to localhost when there is no host", () => {
    expect(getRequestOrigin(headersOf({}))).toBe("http://localhost:3000");
  });
});

describe("buildTableLink", () => {
  it("joins origin and token", () => {
    expect(buildTableLink("https://menu.example.com", "abc123")).toBe("https://menu.example.com/t/abc123");
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildTableLink("https://menu.example.com/", "abc123")).toBe("https://menu.example.com/t/abc123");
  });

  it("encodes the token", () => {
    expect(buildTableLink("http://localhost:3000", "a b/c?d")).toBe("http://localhost:3000/t/a%20b%2Fc%3Fd");
  });
});
