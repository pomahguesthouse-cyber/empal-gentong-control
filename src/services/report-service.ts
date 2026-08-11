import { supabase } from "@/integrations/supabase/client";

export interface Summary {
  gross: number;
  net_sales: number;
  tax: number;
  service: number;
  discount: number;
  order_count: number;
  avg_ticket: number;
}

export interface DailyRow {
  day: string;
  gross: number;
  order_count: number;
  avg_ticket: number;
}

export interface BranchRow {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  gross: number;
  tax: number;
  order_count: number;
  avg_ticket: number;
}

export interface MenuRow {
  name: string;
  qty: number;
  gross: number;
}

export interface HourRow {
  hour: number;
  gross: number;
  order_count: number;
}

export interface PaymentRow {
  method: string;
  total: number;
  trx: number;
}

export interface CashierRow {
  cashier: string;
  gross: number;
  order_count: number;
  avg_ticket: number;
}

export interface Pb1Row {
  branch_code: string;
  branch_name: string;
  tax_rate: number;
  net_sales: number;
  pb1: number;
  order_count: number;
}

export interface ProfitLoss {
  gross: number;
  net_sales: number;
  tax: number;
  service: number;
  discount: number;
  expense_total: number;
  profit: number;
}

export interface ExpenseCatRow {
  category: string;
  total: number;
}

export interface OrderTypeRow {
  order_type: string;
  gross: number;
  order_count: number;
  avg_ticket: number;
}

export interface SlowMenuRow {
  name: string;
  category: string;
  base_price: number;
  qty: number;
  gross: number;
}

export interface ChannelMarginRow {
  name: string;
  category: string;
  base_price: number;
  channel_price: number;
  markup_pct: number;
}

type Params = { p_from: string; p_to: string; p_branch?: string | null };

const panggil = async <T>(nama: string, params: Record<string, unknown>): Promise<T[]> => {
  const { data, error } = await supabase.rpc(nama as never, params as never);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
};

const buatParams = (from: string, to: string, branchId: string | null): Params => ({
  p_from: from,
  p_to: to,
  p_branch: branchId,
});

export const ambilRingkasan = async (from: string, to: string, branchId: string | null): Promise<Summary> => {
  const rows = await panggil<Summary>("report_summary", buatParams(from, to, branchId));
  return (
    rows[0] ?? { gross: 0, net_sales: 0, tax: 0, service: 0, discount: 0, order_count: 0, avg_ticket: 0 }
  );
};

export const ambilHarian = (from: string, to: string, branchId: string | null): Promise<DailyRow[]> =>
  panggil<DailyRow>("report_daily", buatParams(from, to, branchId));

export const ambilPerCabang = (from: string, to: string): Promise<BranchRow[]> =>
  panggil<BranchRow>("report_by_branch", { p_from: from, p_to: to });

export const ambilPerMenu = (from: string, to: string, branchId: string | null): Promise<MenuRow[]> =>
  panggil<MenuRow>("report_by_menu", buatParams(from, to, branchId));

export const ambilPerJam = (from: string, to: string, branchId: string | null): Promise<HourRow[]> =>
  panggil<HourRow>("report_hourly", buatParams(from, to, branchId));

export const ambilPerMetode = (from: string, to: string, branchId: string | null): Promise<PaymentRow[]> =>
  panggil<PaymentRow>("report_by_payment", buatParams(from, to, branchId));

export const ambilPerKasir = (from: string, to: string, branchId: string | null): Promise<CashierRow[]> =>
  panggil<CashierRow>("report_by_cashier", buatParams(from, to, branchId));

export const ambilPb1 = (month: string): Promise<Pb1Row[]> =>
  panggil<Pb1Row>("report_pb1", { p_month: month });

export const ambilLabaRugi = async (
  from: string,
  to: string,
  branchId: string | null,
): Promise<ProfitLoss> => {
  const rows = await panggil<ProfitLoss>("report_profit_loss", buatParams(from, to, branchId));
  return (
    rows[0] ?? { gross: 0, net_sales: 0, tax: 0, service: 0, discount: 0, expense_total: 0, profit: 0 }
  );
};

export const ambilBiayaPerKategori = (
  from: string,
  to: string,
  branchId: string | null,
): Promise<ExpenseCatRow[]> =>
  panggil<ExpenseCatRow>("report_expense_by_category", buatParams(from, to, branchId));

export const ambilPerTipePesanan = (
  from: string,
  to: string,
  branchId: string | null,
): Promise<OrderTypeRow[]> => panggil<OrderTypeRow>("report_by_order_type", buatParams(from, to, branchId));

export const ambilMenuLambat = (
  from: string,
  to: string,
  branchId: string | null,
  limit = 10,
): Promise<SlowMenuRow[]> =>
  panggil<SlowMenuRow>("report_menu_slow", { ...buatParams(from, to, branchId), p_limit: limit });

export const ambilMarginChannel = (channel: string): Promise<ChannelMarginRow[]> =>
  panggil<ChannelMarginRow>("report_channel_margin", { p_channel: channel });

// ==== Kontrol & audit ====
export interface VoidOrder {
  id: string;
  order_no: string;
  branch_id: string;
  grand_total: number;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
  created_by: string | null;
}

export const ambilTransaksiDibatalkan = async (
  from: string,
  to: string,
  branchId: string | null,
): Promise<VoidOrder[]> => {
  let q = supabase
    .from("orders")
    .select("id, order_no, branch_id, grand_total, created_at, voided_at, void_reason, created_by")
    .eq("status", "void")
    .gte("created_at", `${from}T00:00:00+07:00`)
    .lte("created_at", `${to}T23:59:59+07:00`)
    .order("voided_at", { ascending: false })
    .limit(500);
  if (branchId) q = q.eq("branch_id", branchId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as VoidOrder[];
};

export interface DiscountOrder {
  id: string;
  order_no: string;
  branch_id: string;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  created_at: string;
  created_by: string | null;
}

export const ambilDiskonManual = async (
  from: string,
  to: string,
  branchId: string | null,
): Promise<DiscountOrder[]> => {
  let q = supabase
    .from("orders")
    .select("id, order_no, branch_id, subtotal, discount_total, grand_total, created_at, created_by")
    .gt("discount_total", 0)
    .gte("created_at", `${from}T00:00:00+07:00`)
    .lte("created_at", `${to}T23:59:59+07:00`)
    .order("discount_total", { ascending: false })
    .limit(500);
  if (branchId) q = q.eq("branch_id", branchId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as DiscountOrder[];
};

export interface Shift {
  id: string;
  branch_id: string;
  user_id: string | null;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash_counted: number | null;
  closing_cash_expected: number | null;
  variance: number | null;
  notes: string | null;
}

export const ambilShift = async (
  from: string,
  to: string,
  branchId: string | null,
  hanyaSelisih = false,
): Promise<Shift[]> => {
  let q = supabase
    .from("shifts")
    .select("*")
    .gte("opened_at", `${from}T00:00:00+07:00`)
    .lte("opened_at", `${to}T23:59:59+07:00`)
    .order("opened_at", { ascending: false })
    .limit(500);
  if (branchId) q = q.eq("branch_id", branchId);
  if (hanyaSelisih) q = q.neq("variance", 0);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Shift[];
};

export const batalkanTransaksi = async (orderId: string, alasan: string): Promise<void> => {
  const { error } = await supabase
    .from("orders")
    .update({ status: "void", voided_at: new Date().toISOString(), void_reason: alasan })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
};