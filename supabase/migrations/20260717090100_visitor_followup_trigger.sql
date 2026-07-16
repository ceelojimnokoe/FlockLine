-- Auto-creates a "visitor welcome" follow-up, due in 3 days, whenever a
-- member is INSERTed with status = 'first_timer'.
--
-- Implemented as a database trigger rather than application code — see the
-- assistant's explanation for the full justification, in short: this is
-- "the core value of the product" per the spec, so it needs to fire no
-- matter which code path creates the member (the app's Add Member form,
-- the CSV importer, the demo seed script, or anything built later that
-- touches this table directly) rather than depending on every current and
-- future write path remembering to call the same helper function.
--
-- INSERT-only, not UPDATE: a member transitioning back to 'first_timer'
-- from another status isn't "a new visitor arriving," so re-firing on
-- every status-touching UPDATE would risk spurious duplicate welcomes.
create or replace function public.handle_new_first_timer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'first_timer' then
    insert into public.follow_ups (church_id, member_id, type, status, due_date)
    values (new.church_id, new.id, 'visitor_welcome', 'pending', (current_date + interval '3 days')::date);
  end if;
  return new;
end;
$$;

create trigger trg_members_auto_visitor_follow_up
  after insert on public.members
  for each row
  execute function public.handle_new_first_timer();

-- Composite index for the pipeline view's common query shape: filter by
-- church + status, ordered/filtered by due_date.
create index follow_ups_church_status_due_idx on public.follow_ups (church_id, status, due_date);
