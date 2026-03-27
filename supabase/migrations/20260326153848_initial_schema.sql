-- Enable the UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create the Pricing Tiers Table
create table public.pricing_tiers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    price text not null,
    price_value numeric not null, -- Used to ensure the tiers always sort correctly
    features text[] not null,
    gradient text not null,
    is_popular boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the Future Features Table
create table public.future_features (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    icon_name text not null,
    color_theme text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enterprise Security: Enable Row Level Security (RLS)
-- This is mandatory. Without it, anyone with your anon key could delete your tables.
alter table public.pricing_tiers enable row level security;
alter table public.future_features enable row level security;

-- 4. RLS Policies
-- Allow anyone to read the data, but absolutely no one can insert/update/delete from the client.
create policy "Allow public read access to pricing_tiers" 
  on public.pricing_tiers for select using (true);

create policy "Allow public read access to future_features" 
  on public.future_features for select using (true);