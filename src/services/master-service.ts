import { supabase } from "@/integrations/supabase/client";

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  tax_rate: number;
  service_charge_rate: number;
  receipt_header: string | null;
  receipt_footer: string | null;
  is_active: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  sort_order: number;
}

export interface MenuVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price_delta: number;
  is_default: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
}

export interface BranchMenu {
  branch_id: string;
  menu_item_id: string;
  price_override: number | null;
  is_available: boolean;
}

export interface Promo {
  id: string;
  name: string;
  type: string;
  value: number;
  min_purchase: number;
  valid_from: string | null;
  valid_to: string | null;
  active_days: number[];
  active_hours_start: string | null;
  active_hours_end: string | null;
  is_active: boolean;
}

export interface RestoTable {
  id: string;
  branch_id: string;
  name: string;
  capacity: number;
  area: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  branch_id: string;
  category_id: string | null;
  date: string;
  amount: number;
  description: string | null;
  payment_method: string | null;
}

const lempar = (error: { message: string } | null): void => {
  if (error) throw new Error(error.message);
};

export const ambilCabang = async (): Promise<Branch[]> => {
  const { data, error } = await supabase.from("branches").select("*").order("code");
  lempar(error);
  return (data ?? []) as Branch[];
};

export const simpanCabang = async (payload: Partial<Branch>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("branches").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("branches").insert(payload as never);
    lempar(error);
  }
};

export const ambilPengguna = async (): Promise<AppUser[]> => {
  const { data, error } = await supabase.from("users").select("*").order("name");
  lempar(error);
  return (data ?? []) as AppUser[];
};

export const ambilAksesCabang = async (): Promise<{ user_id: string; branch_id: string }[]> => {
  const { data, error } = await supabase.from("user_branches").select("user_id, branch_id");
  lempar(error);
  return data ?? [];
};

export const simpanPengguna = async (payload: Partial<AppUser>, branchIds: string[]): Promise<void> => {
  let userId = payload.id;
  if (userId) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("users").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { data, error } = await supabase
      .from("users")
      .insert(payload as never)
      .select("id")
      .single();
    lempar(error);
    userId = (data as { id: string }).id;
  }
  await supabase.from("user_branches").delete().eq("user_id", userId as string);
  if (branchIds.length > 0) {
    const { error } = await supabase
      .from("user_branches")
      .insert(branchIds.map((b) => ({ user_id: userId!, branch_id: b })));
    lempar(error);
  }
};

export const ambilKategori = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  lempar(error);
  return (data ?? []) as Category[];
};

export const simpanKategori = async (payload: Partial<Category>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("categories").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("categories").insert(payload as never);
    lempar(error);
  }
};

export const ambilMenu = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase.from("menu_items").select("*").order("sort_order");
  lempar(error);
  return (data ?? []) as MenuItem[];
};

export const simpanMenu = async (payload: Partial<MenuItem>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("menu_items").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("menu_items").insert(payload as never);
    lempar(error);
  }
};

export const ambilVarian = async (): Promise<MenuVariant[]> => {
  const { data, error } = await supabase.from("menu_variants").select("*").order("name");
  lempar(error);
  return (data ?? []) as MenuVariant[];
};

export const simpanVarian = async (payload: Partial<MenuVariant>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("menu_variants").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("menu_variants").insert(payload as never);
    lempar(error);
  }
};

export const hapusVarian = async (id: string): Promise<void> => {
  const { error } = await supabase.from("menu_variants").delete().eq("id", id);
  lempar(error);
};

export const ambilGrupModifier = async (): Promise<ModifierGroup[]> => {
  const { data, error } = await supabase.from("modifier_groups").select("*").order("name");
  lempar(error);
  return (data ?? []) as ModifierGroup[];
};

export const ambilModifier = async (): Promise<Modifier[]> => {
  const { data, error } = await supabase.from("modifiers").select("*").order("name");
  lempar(error);
  return (data ?? []) as Modifier[];
};

export const simpanModifier = async (payload: Partial<Modifier>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("modifiers").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("modifiers").insert(payload as never);
    lempar(error);
  }
};

export const hapusModifier = async (id: string): Promise<void> => {
  const { error } = await supabase.from("modifiers").delete().eq("id", id);
  lempar(error);
};

export const ambilHargaCabang = async (): Promise<BranchMenu[]> => {
  const { data, error } = await supabase.from("branch_menu").select("*");
  lempar(error);
  return (data ?? []) as BranchMenu[];
};

export const simpanHargaCabang = async (payload: BranchMenu): Promise<void> => {
  const { error } = await supabase.from("branch_menu").upsert(payload as never, {
    onConflict: "branch_id,menu_item_id",
  });
  lempar(error);
};

export const ambilPromo = async (): Promise<Promo[]> => {
  const { data, error } = await supabase.from("promos").select("*").order("name");
  lempar(error);
  return (data ?? []) as Promo[];
};

export const ambilPromoCabang = async (): Promise<{ promo_id: string; branch_id: string }[]> => {
  const { data, error } = await supabase.from("promo_branches").select("promo_id, branch_id");
  lempar(error);
  return data ?? [];
};

export const simpanPromo = async (payload: Partial<Promo>, branchIds: string[]): Promise<void> => {
  let promoId = payload.id;
  if (promoId) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("promos").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { data, error } = await supabase
      .from("promos")
      .insert(payload as never)
      .select("id")
      .single();
    lempar(error);
    promoId = (data as { id: string }).id;
  }
  await supabase.from("promo_branches").delete().eq("promo_id", promoId as string);
  if (branchIds.length > 0) {
    const { error } = await supabase
      .from("promo_branches")
      .insert(branchIds.map((b) => ({ promo_id: promoId!, branch_id: b })));
    lempar(error);
  }
};

export const ambilMeja = async (branchId: string | null): Promise<RestoTable[]> => {
  let q = supabase.from("tables").select("*").order("name");
  if (branchId) q = q.eq("branch_id", branchId);
  const { data, error } = await q;
  lempar(error);
  return (data ?? []) as RestoTable[];
};

export const simpanMeja = async (payload: Partial<RestoTable>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("tables").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("tables").insert(payload as never);
    lempar(error);
  }
};

export const hapusMeja = async (id: string): Promise<void> => {
  const { error } = await supabase.from("tables").delete().eq("id", id);
  lempar(error);
};

export const ambilKategoriBiaya = async (): Promise<ExpenseCategory[]> => {
  const { data, error } = await supabase.from("expense_categories").select("*").order("name");
  lempar(error);
  return (data ?? []) as ExpenseCategory[];
};

export const ambilBiaya = async (branchId: string | null, from: string, to: string): Promise<Expense[]> => {
  let q = supabase
    .from("expenses")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .limit(1000);
  if (branchId) q = q.eq("branch_id", branchId);
  const { data, error } = await q;
  lempar(error);
  return (data ?? []) as Expense[];
};

export const simpanBiaya = async (payload: Partial<Expense>): Promise<void> => {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("expenses").update(rest).eq("id", id);
    lempar(error);
  } else {
    const { error } = await supabase.from("expenses").insert(payload as never);
    lempar(error);
  }
};

export const hapusBiaya = async (id: string): Promise<void> => {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  lempar(error);
};