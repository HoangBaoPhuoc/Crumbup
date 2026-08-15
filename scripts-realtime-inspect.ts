import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const rls = await client.query(`
    select relname, relrowsecurity, relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'realtime' and c.relname = 'messages';
  `);
  console.log("realtime.messages RLS state:", rls.rows[0]);

  const policies = await client.query(`
    select policyname, cmd, roles, qual from pg_policies where schemaname = 'realtime' and tablename = 'messages';
  `);
  console.log("Existing policies on realtime.messages:", policies.rows);

  const funcOwner = await client.query(`
    select p.proname, r.rolname as owner, p.prosecdef
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    join pg_roles r on r.oid = p.proowner
    where n.nspname = 'realtime' and p.proname = 'broadcast_changes';
  `);
  console.log("broadcast_changes owner/security-definer:", funcOwner.rows);

  const existingTriggers = await client.query(`
    select tgname, tgrelid::regclass as table_name
    from pg_trigger
    where not tgisinternal
    and tgrelid in ('"Message"'::regclass, '"Notification"'::regclass);
  `);
  console.log("Existing triggers on Message/Notification:", existingTriggers.rows);

  await client.end();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
