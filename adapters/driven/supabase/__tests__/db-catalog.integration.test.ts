// Checks the database itself, through the catalog, for what the REST API can't
// show: the exact privileges every public table grants to anon / authenticated /
// PUBLIC (including TRUNCATE, REFERENCES, TRIGGER and MAINTAIN), that RLS is on
// everywhere, how the ordering functions are declared, and who can execute
// anything in `public`. It is the automated version of the SQL check documented
// in docs/build-plan.md (6c). Run with:
//   docker compose run --rm --no-deps app pnpm test:integration
//
// Adding a table or a function to `public` makes these tests fail until its
// access is written down here — on purpose: new exposure gets reviewed.
import { describe, expect, it } from "vitest";
import { withTestDb } from "./support/test-db";

// table -> privileges each role must hold, and nothing more.
const EXPECTED_TABLE_PRIVILEGES: Record<string, { anon: string; authenticated: string }> = {
  restaurants: { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  categories: { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  menu_items: { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  tags: { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  menu_item_tags: { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  // The QR token is a credential: customers never touch these tables directly.
  dining_tables: { anon: "", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  table_sessions: { anon: "", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  orders: { anon: "", authenticated: "SELECT" },
  order_items: { anon: "", authenticated: "SELECT" },
};

const CUSTOMER_FUNCTIONS = ["get_table_status", "place_order"];

describe("database access model (integration, via the catalog)", () => {
  it("grants every public table exactly the privileges of the access model, and nothing to PUBLIC", async () => {
    const granted = await withTestDb((db) =>
      db.query<{ relname: string; grantee: string; privileges: string }>(`
        select c.relname,
               case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as grantee,
               string_agg(a.privilege_type, ',' order by a.privilege_type) as privileges
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        cross join lateral aclexplode(c.relacl) a
        where n.nspname = 'public' and c.relkind = 'r'
          and (a.grantee = 0 or a.grantee::regrole::text in ('anon', 'authenticated'))
        group by 1, 2`),
    );
    const byTable = new Map<string, Record<string, string>>();
    for (const row of granted.rows) {
      byTable.set(row.relname, { ...byTable.get(row.relname), [row.grantee]: row.privileges });
    }

    const tables = await withTestDb((db) =>
      db.query<{ relname: string }>(
        `select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1`,
      ),
    );
    expect(tables.rows.map((r) => r.relname)).toEqual(Object.keys(EXPECTED_TABLE_PRIVILEGES).sort());

    for (const [table, expected] of Object.entries(EXPECTED_TABLE_PRIVILEGES)) {
      const actual = byTable.get(table) ?? {};
      expect({ table, anon: actual.anon ?? "", authenticated: actual.authenticated ?? "", public: actual.PUBLIC ?? "" }).toEqual({
        table,
        anon: expected.anon,
        authenticated: expected.authenticated,
        public: "",
      });
    }
  });

  it("has row level security enabled on every public table", async () => {
    const unprotected = await withTestDb((db) =>
      db.query<{ relname: string }>(
        `select relname from pg_class
         where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity order by 1`,
      ),
    );

    expect(unprotected.rows).toEqual([]);
  });

  it("does not auto-grant tables created by postgres to anon or authenticated", async () => {
    const defaults = await withTestDb((db) =>
      db.query<{ defaclacl: string }>(
        `select defaclacl::text from pg_default_acl
         where defaclrole = 'postgres'::regrole and defaclnamespace = 'public'::regnamespace and defaclobjtype = 'r'`,
      ),
    );

    // The row must exist, or the loop below would pass without checking anything.
    expect(defaults.rows.length).toBeGreaterThan(0);
    for (const row of defaults.rows) {
      expect(row.defaclacl).not.toMatch(/anon=|authenticated=/);
    }
  });

  it.each(CUSTOMER_FUNCTIONS)("declares %s as security definer with an empty search_path", async (name) => {
    const found = await withTestDb((db) =>
      db.query<{ prosecdef: boolean; proconfig: string[] | null }>(
        `select prosecdef, proconfig from pg_proc where pronamespace = 'public'::regnamespace and proname = $1`,
        [name],
      ),
    );

    expect(found.rows).toHaveLength(1);
    expect(found.rows[0]?.prosecdef).toBe(true);
    expect(found.rows[0]?.proconfig).toContain('search_path=""');
  });

  it("lets only the two customer functions be executed by anon or authenticated, and nothing by PUBLIC", async () => {
    const executable = await withTestDb(async (db) => {
      const forRole = async (role: string): Promise<string[]> => {
        const result = await db.query<{ proname: string }>(
          `select proname from pg_proc
           where pronamespace = 'public'::regnamespace and has_function_privilege($1, oid, 'EXECUTE') order by 1`,
          [role],
        );
        return result.rows.map((r) => r.proname);
      };
      const publicGrants = await db.query(
        `select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a
         where p.pronamespace = 'public'::regnamespace and a.grantee = 0`,
      );
      return { anon: await forRole("anon"), authenticated: await forRole("authenticated"), publicGrants: publicGrants.rowCount };
    });

    expect(executable.anon).toEqual(CUSTOMER_FUNCTIONS);
    expect(executable.authenticated).toEqual(CUSTOMER_FUNCTIONS);
    expect(executable.publicGrants).toBe(0);
  });
});
