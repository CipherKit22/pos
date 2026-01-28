
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  stock integer not null default 0,
  image_url text
);

-- Sales Table
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  total numeric not null,
  profit numeric not null,
  payment_type text check (payment_type in ('CASH', 'KPAY', 'MIXED')),
  cash_amount numeric default 0,
  kpay_amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sale Items Table
create table if not exists sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  qty integer not null,
  price numeric not null -- snapshot price at time of sale
);

-- Storage Bucket Setup (Safe Insert)
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Policies (Drop first to avoid errors on re-run, then recreate)
-- Products
drop policy if exists "Public Access Products" on products;
create policy "Public Access Products" on products for all using (true);

-- Sales
drop policy if exists "Public Access Sales" on sales;
create policy "Public Access Sales" on sales for all using (true);

-- Sale Items
drop policy if exists "Public Access SaleItems" on sale_items;
create policy "Public Access SaleItems" on sale_items for all using (true);

-- Storage
drop policy if exists "Public Images Select" on storage.objects;
create policy "Public Images Select" on storage.objects for select using ( bucket_id = 'product-images' );

drop policy if exists "Upload Images Insert" on storage.objects;
create policy "Upload Images Insert" on storage.objects for insert with check ( bucket_id = 'product-images' );

-- RPC for Stock Update
create or replace function decrement_stock(row_id uuid, amount int)
returns void as $$
begin
  update products 
  set stock = stock - amount
  where id = row_id;
end;
$$ language plpgsql;

-- --- SCHEMA UPDATES FOR NEW PAYMENT LOGIC ---
-- These allow running the script multiple times without error

do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'cash_received') then
    alter table sales add column cash_received numeric default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'kpay_received') then
    alter table sales add column kpay_received numeric default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'change_amount') then
    alter table sales add column change_amount numeric default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'change_method') then
    alter table sales add column change_method text check (change_method in ('CASH', 'KPAY', 'NONE')) default 'NONE';
  end if;
end $$;

-- --- SCHEMA UPDATES FOR SOFT DELETE ---
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'is_deleted') then
    alter table products add column is_deleted boolean default false;
  end if;
end $$;
