-- Supabase Realtime "Broadcast from Database" wiring for chat/notifications.
-- Not managed by `prisma db push` (triggers/RLS policies aren't expressible
-- in schema.prisma) — kept here for reference and re-application if the
-- database is ever rebuilt. Safe to re-run: everything is CREATE OR REPLACE /
-- DROP ... IF EXISTS.
--
-- Pattern: DB triggers call realtime.broadcast_changes() directly (no
-- logical replication/postgres_changes involved), so private-channel
-- authorization is enforced via RLS policies on realtime.messages using
-- realtime.topic() + auth.uid().
--
-- Topics:
--   conversation:<conversationId>  — new Message rows, readable by the
--                                     conversation's customer and store owner
--   user:<userId>                  — new Notification rows, readable only
--                                     by that user (drives unread badges)

drop trigger if exists trg_broadcast_message_insert on "Message";
drop function if exists public.broadcast_message_insert();

-- Fires on both INSERT (new message) and UPDATE OF "readAt" (seen receipt),
-- so ChatThread can show "Đã xem" live instead of waiting for the next poll.
create or replace function public.broadcast_message_change()
returns trigger
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'conversation:' || new."conversationId",
    TG_OP,
    TG_OP,
    'Message',
    'public',
    new,
    old
  );
  return new;
end;
$$;

drop trigger if exists trg_broadcast_message_change_insert on "Message";
create trigger trg_broadcast_message_change_insert
after insert on "Message"
for each row execute function public.broadcast_message_change();

drop trigger if exists trg_broadcast_message_change_update on "Message";
create trigger trg_broadcast_message_change_update
after update of "readAt" on "Message"
for each row execute function public.broadcast_message_change();

create or replace function public.broadcast_notification_insert()
returns trigger
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'user:' || new."userId",
    'INSERT',
    'INSERT',
    'Notification',
    'public',
    new,
    old
  );
  return new;
end;
$$;

drop trigger if exists trg_broadcast_notification_insert on "Notification";
create trigger trg_broadcast_notification_insert
after insert on "Notification"
for each row execute function public.broadcast_notification_insert();

drop policy if exists "conversation participants can read broadcasts" on "realtime"."messages";
create policy "conversation participants can read broadcasts"
on "realtime"."messages"
for select
to authenticated
using (
  realtime.topic() like 'conversation:%'
  and exists (
    select 1
    from "Conversation" c
    join "Store" s on s.id = c."storeId"
    where c.id = replace(realtime.topic(), 'conversation:', '')
      and (c."userId" = auth.uid()::text or s."ownerId" = auth.uid()::text)
  )
);

drop policy if exists "users can read own notification broadcasts" on "realtime"."messages";
create policy "users can read own notification broadcasts"
on "realtime"."messages"
for select
to authenticated
using (
  realtime.topic() = 'user:' || auth.uid()::text
);
