-- ================================================================
-- FlowPilot — Supabase Schema
-- Run this in your Supabase SQL editor
-- ================================================================

-- Businesses
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  moolre_account_number text not null,
  created_at timestamptz default now() not null
);

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  phone text not null,
  created_at timestamptz default now() not null
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  customer_name text not null,
  customer_phone text not null,
  amount numeric(12,2) not null check (amount > 0),
  description text,
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  due_date date,
  payment_link text,
  external_ref text unique,
  moolre_transaction_id text,
  created_at timestamptz default now() not null
);

-- Transactions (synced from Moolre webhook)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  type text not null check (type in ('in','out')),
  amount numeric(12,2) not null,
  description text,
  status text not null default 'pending' check (status in ('pending','paid','sent','failed')),
  moolre_ref text unique,
  created_at timestamptz default now() not null
);

-- Disbursements
create table if not exists public.disbursements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  recipient_name text not null,
  phone text not null,
  network text not null,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  external_ref text unique,
  moolre_ref text,
  created_at timestamptz default now() not null
);

-- ── Row Level Security ────────────────────────────────────────

alter table public.businesses enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.transactions enable row level security;
alter table public.disbursements enable row level security;

-- Businesses: users own their business
create policy "owner_all_businesses" on public.businesses
  for all using (auth.uid() = user_id);

-- Helper function: get current user's business id
create or replace function public.my_business_id()
returns uuid language sql security definer
as $$ select id from public.businesses where user_id = auth.uid() limit 1 $$;

-- Customers
create policy "owner_all_customers" on public.customers
  for all using (business_id = public.my_business_id());

-- Invoices
create policy "owner_all_invoices" on public.invoices
  for all using (business_id = public.my_business_id());

-- Transactions
create policy "owner_all_transactions" on public.transactions
  for all using (business_id = public.my_business_id());

-- Disbursements
create policy "owner_all_disbursements" on public.disbursements
  for all using (business_id = public.my_business_id());

-- ── Indexes ────────────────────────────────────────────────────

create index if not exists idx_invoices_business on public.invoices(business_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_transactions_business on public.transactions(business_id);
create index if not exists idx_disbursements_business on public.disbursements(business_id);
create index if not exists idx_invoices_external_ref on public.invoices(external_ref);

-- ── Auto-mark overdue invoices ─────────────────────────────────

create or replace function public.mark_overdue_invoices()
returns void language sql security definer as $$
  update public.invoices
  set status = 'overdue'
  where status = 'pending'
    and due_date < current_date;
$$;

-- Run via Supabase cron or call from your app on load
