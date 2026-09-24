// Direct connection to the LOCAL Supabase database, for the few integration
// tests that need SQL the REST API can't do: installing a temporary trigger
// (DDL), holding a row lock in a second transaction, and reading the catalog
// (grants, function properties). Everything else goes through the API, like
// the real app does.
import { Client, type ClientConfig } from "pg";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "host.docker.internal"]);

// These tests create and drop database objects, so a stray production URL in
// .env.local must never reach them. The settings are built from the URL's own
// parts and nothing else: handing the URL to `pg` as a connection string would
// also honor query parameters such as ?host=... or ?port=..., which redirect the
// connection somewhere this hostname check never looked.
export function localConnectionConfig(url: string): ClientConfig {
  const parsed = new URL(url);

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Refusing to run against "${parsed.hostname}": TEST_DATABASE_URL must point at the local Supabase database.`,
    );
  }
  if (parsed.search !== "") {
    throw new Error("TEST_DATABASE_URL must not carry query parameters (they can redirect the connection).");
  }

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.slice(1)),
  };
}

function testDatabaseConfig(): ClientConfig {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL must be set in .env.local (see .env.example)");
  return localConnectionConfig(url);
}

export async function connectTestDb(): Promise<Client> {
  const client = new Client(testDatabaseConfig());
  await client.connect();
  return client;
}

export async function withTestDb<T>(run: (db: Client) => Promise<T>): Promise<T> {
  const db = await connectTestDb();
  try {
    return await run(db);
  } finally {
    await db.end();
  }
}

// Polls a condition instead of sleeping a fixed time; gives up after ~5s.
export async function waitUntil(condition: () => Promise<boolean>, what: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for: ${what}`);
}
