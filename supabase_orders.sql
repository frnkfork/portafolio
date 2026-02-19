-- Create the 'orders' table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  table_number text not null,
  items jsonb not null,
  total decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'preparing', 'delivered', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for the 'orders' table
alter publication supabase_realtime add table orders;

-- Configurar Políticas de Seguridad (RLS)
alter table public.orders enable row level security;
create policy "Public Access Orders" on public.orders for select using (true);
create policy "Allow Insert Orders" on public.orders for insert with check (true);
create policy "Allow All Orders" on public.orders for all using (true);
