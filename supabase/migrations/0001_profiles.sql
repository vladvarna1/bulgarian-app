-- Profiles and settings, created automatically on sign-up.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  goal_reason text,
  placement_level int,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal_min int not null default 10,
  reminder_time time,
  tz text not null default 'Europe/Sofia',
  sound boolean not null default true,
  stress_marks boolean not null default true,
  translit boolean not null default false,
  hearts_mode boolean not null default false,
  push_subscription jsonb
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
-- role is deliberately not updatable by users (see trigger below)
create policy "own profile update" on public.profiles for update using (id = auth.uid());
create policy "own settings all" on public.user_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create function public.protect_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
