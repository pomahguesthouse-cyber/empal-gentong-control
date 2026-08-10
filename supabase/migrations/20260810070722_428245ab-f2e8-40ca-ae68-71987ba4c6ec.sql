-- ===== Master =====
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  tax_rate INT NOT NULL DEFAULT 10,
  service_charge_rate INT NOT NULL DEFAULT 0,
  receipt_header TEXT,
  receipt_footer TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('owner','manager','kasir','waiter','dapur','akunting')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_branches (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, branch_id)
);

CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Menu =====
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  base_price BIGINT NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta BIGINT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_select INT NOT NULL DEFAULT 0,
  max_select INT NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE public.modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE public.item_modifiers (
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, modifier_group_id)
);

CREATE TABLE public.branch_menu (
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  price_override BIGINT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (branch_id, menu_item_id)
);

-- ===== Promo =====
CREATE TABLE public.promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent','fixed')),
  value BIGINT NOT NULL DEFAULT 0,
  min_purchase BIGINT NOT NULL DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  active_days INT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  active_hours_start TIME,
  active_hours_end TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.promo_branches (
  promo_id UUID NOT NULL REFERENCES public.promos(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  PRIMARY KEY (promo_id, branch_id)
);

CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Transaksi =====
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_cash BIGINT NOT NULL DEFAULT 0,
  closing_cash_counted BIGINT,
  closing_cash_expected BIGINT,
  variance BIGINT,
  notes TEXT
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  order_no TEXT NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','delivery')),
  guest_count INT NOT NULL DEFAULT 1,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','void')),
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount_total BIGINT NOT NULL DEFAULT 0,
  tax_total BIGINT NOT NULL DEFAULT 0,
  service_charge_total BIGINT NOT NULL DEFAULT 0,
  grand_total BIGINT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.menu_variants(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  unit_price_snapshot BIGINT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  discount BIGINT NOT NULL DEFAULT 0,
  line_total BIGINT NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE public.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  modifier_id UUID REFERENCES public.modifiers(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_snapshot BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('tunai','qris','debit','kartu_kredit','gofood','grabfood','shopeefood')),
  amount BIGINT NOT NULL DEFAULT 0,
  reference_no TEXT,
  cash_received BIGINT,
  change_given BIGINT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Biaya & audit =====
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT current_date,
  amount BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  payment_method TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Indexes =====
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX idx_branch_menu_item ON public.branch_menu(menu_item_id);
CREATE INDEX idx_orders_branch_created ON public.orders(branch_id, created_at);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_voided ON public.orders(voided_at);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_menu ON public.order_items(menu_item_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_expenses_branch_date ON public.expenses(branch_id, date);
CREATE INDEX idx_shifts_branch ON public.shifts(branch_id, opened_at);

-- ===== Grants + RLS =====
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'branches','users','user_branches','devices','categories','menu_items','menu_variants',
    'modifier_groups','modifiers','item_modifiers','branch_menu','promos','promo_branches',
    'tables','shifts','orders','order_items','order_item_modifiers','payments',
    'expense_categories','expenses','audit_log'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "app_read_%s" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "app_write_%s" ON public.%I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "app_update_%s" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Hapus permanen hanya untuk data master, bukan transaksi
CREATE POLICY "app_delete_master_menu_items" ON public.menu_items FOR DELETE USING (true);
CREATE POLICY "app_delete_master_categories" ON public.categories FOR DELETE USING (true);
CREATE POLICY "app_delete_master_menu_variants" ON public.menu_variants FOR DELETE USING (true);
CREATE POLICY "app_delete_master_modifiers" ON public.modifiers FOR DELETE USING (true);
CREATE POLICY "app_delete_master_modifier_groups" ON public.modifier_groups FOR DELETE USING (true);
CREATE POLICY "app_delete_master_item_modifiers" ON public.item_modifiers FOR DELETE USING (true);
CREATE POLICY "app_delete_master_branch_menu" ON public.branch_menu FOR DELETE USING (true);
CREATE POLICY "app_delete_master_tables" ON public.tables FOR DELETE USING (true);
CREATE POLICY "app_delete_master_promos" ON public.promos FOR DELETE USING (true);
CREATE POLICY "app_delete_master_promo_branches" ON public.promo_branches FOR DELETE USING (true);
CREATE POLICY "app_delete_master_user_branches" ON public.user_branches FOR DELETE USING (true);
CREATE POLICY "app_delete_master_expenses" ON public.expenses FOR DELETE USING (true);
CREATE POLICY "app_delete_master_expense_categories" ON public.expense_categories FOR DELETE USING (true);
CREATE POLICY "app_delete_master_devices" ON public.devices FOR DELETE USING (true);
CREATE POLICY "app_delete_master_users" ON public.users FOR DELETE USING (true);
CREATE POLICY "app_delete_master_branches" ON public.branches FOR DELETE USING (true);