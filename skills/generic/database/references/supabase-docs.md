# Database References

## Supabase Documentation

- Getting Started: https://supabase.com/docs
- Auth: https://supabase.com/docs/guides/auth
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security

## Local References

### Key Files
- `lib/supabase/server.ts` - Server client
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/middleware.ts` - Session refresh
- `types/database.ts` - Generated types

### Migration Commands
```bash
# Create new migration
pnpm supabase migration new [name]

# Apply migrations
pnpm supabase db push

# Generate types
pnpm supabase gen types typescript --local > types/database.ts
```

## RLS Template

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User-owned data
CREATE POLICY "Users own their data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
