CREATE OR REPLACE FUNCTION public.report_summary(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (gross BIGINT, net_sales BIGINT, tax BIGINT, service BIGINT, discount BIGINT, order_count BIGINT, avg_ticket BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(sum(grand_total),0)::BIGINT,
         coalesce(sum(subtotal - discount_total),0)::BIGINT,
         coalesce(sum(tax_total),0)::BIGINT,
         coalesce(sum(service_charge_total),0)::BIGINT,
         coalesce(sum(discount_total),0)::BIGINT,
         count(*)::BIGINT,
         coalesce(round(avg(grand_total)),0)::BIGINT
  FROM orders
  WHERE status = 'paid'
    AND (created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR branch_id = p_branch);
$$;

CREATE OR REPLACE FUNCTION public.report_daily(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (day DATE, gross BIGINT, order_count BIGINT, avg_ticket BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (created_at AT TIME ZONE 'Asia/Jakarta')::date AS day,
         sum(grand_total)::BIGINT, count(*)::BIGINT, round(avg(grand_total))::BIGINT
  FROM orders
  WHERE status = 'paid'
    AND (created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR branch_id = p_branch)
  GROUP BY 1 ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.report_by_branch(p_from DATE, p_to DATE)
RETURNS TABLE (branch_id UUID, branch_code TEXT, branch_name TEXT, gross BIGINT, tax BIGINT, order_count BIGINT, avg_ticket BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT b.id, b.code, b.name,
         coalesce(sum(o.grand_total),0)::BIGINT,
         coalesce(sum(o.tax_total),0)::BIGINT,
         count(o.id)::BIGINT,
         coalesce(round(avg(o.grand_total)),0)::BIGINT
  FROM branches b
  LEFT JOIN orders o ON o.branch_id = b.id AND o.status = 'paid'
    AND (o.created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
  GROUP BY b.id, b.code, b.name ORDER BY 4 DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_by_menu(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (name TEXT, qty BIGINT, gross BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT oi.name_snapshot, sum(oi.qty)::BIGINT, sum(oi.line_total)::BIGINT
  FROM order_items oi JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'paid'
    AND (o.created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR o.branch_id = p_branch)
  GROUP BY 1 ORDER BY 3 DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_hourly(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (hour INT, gross BIGINT, order_count BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT extract(hour FROM (o.created_at AT TIME ZONE 'Asia/Jakarta'))::INT,
         sum(o.grand_total)::BIGINT, count(*)::BIGINT
  FROM orders o
  WHERE o.status = 'paid'
    AND (o.created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR o.branch_id = p_branch)
  GROUP BY 1 ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.report_by_payment(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (method TEXT, total BIGINT, trx BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.method, sum(p.amount)::BIGINT, count(*)::BIGINT
  FROM payments p JOIN orders o ON o.id = p.order_id
  WHERE o.status = 'paid'
    AND (o.created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR o.branch_id = p_branch)
  GROUP BY 1 ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_by_cashier(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (cashier TEXT, gross BIGINT, order_count BIGINT, avg_ticket BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(u.name,'Tidak diketahui'), sum(o.grand_total)::BIGINT, count(*)::BIGINT, round(avg(o.grand_total))::BIGINT
  FROM orders o LEFT JOIN users u ON u.id = o.created_by
  WHERE o.status = 'paid'
    AND (o.created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR o.branch_id = p_branch)
  GROUP BY 1 ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_pb1(p_month DATE)
RETURNS TABLE (branch_code TEXT, branch_name TEXT, tax_rate INT, net_sales BIGINT, pb1 BIGINT, order_count BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT b.code, b.name, b.tax_rate,
         coalesce(sum(o.subtotal - o.discount_total + o.service_charge_total),0)::BIGINT,
         coalesce(sum(o.tax_total),0)::BIGINT,
         count(o.id)::BIGINT
  FROM branches b
  LEFT JOIN orders o ON o.branch_id = b.id AND o.status = 'paid'
    AND date_trunc('month', (o.created_at AT TIME ZONE 'Asia/Jakarta')) = date_trunc('month', p_month::timestamp)
  GROUP BY b.code, b.name, b.tax_rate ORDER BY b.code;
$$;

CREATE OR REPLACE FUNCTION public.report_profit_loss(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (gross BIGINT, net_sales BIGINT, tax BIGINT, service BIGINT, discount BIGINT, expense_total BIGINT, profit BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH s AS (
    SELECT coalesce(sum(grand_total),0)::BIGINT g,
           coalesce(sum(subtotal - discount_total),0)::BIGINT ns,
           coalesce(sum(tax_total),0)::BIGINT t,
           coalesce(sum(service_charge_total),0)::BIGINT sv,
           coalesce(sum(discount_total),0)::BIGINT dc
    FROM orders WHERE status = 'paid'
      AND (created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN p_from AND p_to
      AND (p_branch IS NULL OR branch_id = p_branch)
  ), e AS (
    SELECT coalesce(sum(amount),0)::BIGINT ex FROM expenses
    WHERE date BETWEEN p_from AND p_to AND (p_branch IS NULL OR branch_id = p_branch)
  )
  SELECT s.g, s.ns, s.t, s.sv, s.dc, e.ex, (s.ns - e.ex)::BIGINT FROM s, e;
$$;

CREATE OR REPLACE FUNCTION public.report_expense_by_category(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (category TEXT, total BIGINT)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(c.name,'Lain-lain'), sum(e.amount)::BIGINT
  FROM expenses e LEFT JOIN expense_categories c ON c.id = e.category_id
  WHERE e.date BETWEEN p_from AND p_to AND (p_branch IS NULL OR e.branch_id = p_branch)
  GROUP BY 1 ORDER BY 2 DESC;
$$;

GRANT EXECUTE ON FUNCTION public.report_summary(DATE,DATE,UUID), public.report_daily(DATE,DATE,UUID),
  public.report_by_branch(DATE,DATE), public.report_by_menu(DATE,DATE,UUID), public.report_hourly(DATE,DATE,UUID),
  public.report_by_payment(DATE,DATE,UUID), public.report_by_cashier(DATE,DATE,UUID), public.report_pb1(DATE),
  public.report_profit_loss(DATE,DATE,UUID), public.report_expense_by_category(DATE,DATE,UUID)
  TO anon, authenticated, service_role;