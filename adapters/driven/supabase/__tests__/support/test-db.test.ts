// Unit test of the guard that keeps DDL-capable integration tests on the local
// database. No connection is made.
import { describe, expect, it } from "vitest";
import { localConnectionConfig } from "@/adapters/driven/supabase/__tests__/support/test-db";

describe("localConnectionConfig", () => {
  it.each(["127.0.0.1", "localhost", "host.docker.internal"])("accepts %s and builds the settings from the URL parts", (host) => {
    expect(localConnectionConfig(`postgresql://postgres:s%40cret@${host}:54322/postgres`)).toEqual({
      host,
      port: 54322,
      user: "postgres",
      password: "s@cret",
      database: "postgres",
    });
  });

  it.each([
    ["a real remote host", "postgresql://u:p@db.abcdefgh.supabase.co:5432/postgres"],
    ["a lookalike that merely starts with localhost", "postgresql://u:p@localhost.evil.com:5432/postgres"],
    ["a lookalike using userinfo", "postgresql://localhost@evil.com:5432/postgres"],
    ["a shortened loopback", "postgresql://u:p@127.1:5432/postgres"],
    ["an upper-case localhost (fail closed)", "postgresql://u:p@LOCALHOST:5432/postgres"],
    ["no host at all (unix socket style)", "postgresql:///postgres?host=/var/run/postgresql"],
  ])("refuses %s", (_label, url) => {
    expect(() => localConnectionConfig(url)).toThrow();
  });

  it.each([
    ["?host= (pg would connect there instead)", "postgresql://u:p@127.0.0.1:54322/postgres?host=evil.example"],
    ["?port=", "postgresql://u:p@127.0.0.1:54322/postgres?port=1"],
    ["any other query string", "postgresql://u:p@127.0.0.1:54322/postgres?sslmode=disable"],
  ])("refuses a local hostname carrying %s", (_label, url) => {
    expect(() => localConnectionConfig(url)).toThrow(/query parameters/);
  });
});
