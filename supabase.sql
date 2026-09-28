create extension if not exists pgcrypto;

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  model text,
  year int,
  km text,
  price bigint,
  status text not null default 'Tersedia' check (status in ('Tersedia','Stok Habis')),
  transmission text,
  color text,
  condition text default 'Bekas',
  description text,
  photos text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cars enable row level security;

drop policy if exists "Public can read cars" on public.cars;
create policy "Public can read cars"
on public.cars for select
using (true);

drop policy if exists "Authenticated can insert cars" on public.cars;
create policy "Authenticated can insert cars"
on public.cars for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update cars" on public.cars;
create policy "Authenticated can update cars"
on public.cars for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete cars" on public.cars;
create policy "Authenticated can delete cars"
on public.cars for delete
to authenticated
using (true);

create or replace function public.set_cars_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cars_updated_at on public.cars;
create trigger cars_updated_at
before update on public.cars
for each row execute function public.set_cars_updated_at();

-- Create this Storage bucket from Supabase Dashboard as a public bucket:
-- Bucket name: car-photos
-- Then add Storage policies allowing authenticated users to upload/update/delete
-- and public users to read objects.
