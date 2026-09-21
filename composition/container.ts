// Every use-case factory, one module at a time. Kept as a single import point
// so tests can build a use case around any Supabase client they like (see
// adapters/driven/supabase/__tests__). Nothing else lives here.
//
// Deliberately NOT re-exported: request-scope.ts, which needs Next's request
// cookies and is only meant for app/.
export * from "@/composition/catalog";
export * from "@/composition/identity";
