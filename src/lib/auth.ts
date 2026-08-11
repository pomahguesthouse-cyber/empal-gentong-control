import { supabase } from "@/integrations/supabase/client";

// Supabase Auth berbasis email. Karena login dipakai dengan username,
// username dipetakan ke alamat internal yang tidak pernah dikirimi surel.
export const DOMAIN_INTERNAL = "empalgentong.local";

export const usernameKeEmail = (input: string): string => {
  const bersih = input.trim().toLowerCase();
  return bersih.includes("@") ? bersih : `${bersih}@${DOMAIN_INTERNAL}`;
};

export const emailKeUsername = (email: string | null | undefined): string => {
  if (!email) return "-";
  return email.endsWith(`@${DOMAIN_INTERNAL}`) ? email.split("@")[0] : email;
};

export interface Profil {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  branch_ids: string[];
}

export const masuk = async (username: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameKeEmail(username),
    password,
  });
  if (error) {
    // Pesan bawaan Supabase berbahasa Inggris dan membocorkan apakah akun ada.
    if (error.message.toLowerCase().includes("invalid login")) {
      throw new Error("Username atau password salah");
    }
    throw new Error(error.message);
  }
};

export const keluar = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

// Profil diambil dari tabel users lewat kolom auth_user_id.
// Mengembalikan null bila akun auth belum ditautkan ke baris users mana pun.
export const ambilProfilSaya = async (): Promise<Profil | null> => {
  const { data: sesi } = await supabase.auth.getUser();
  const uid = sesi.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, is_active")
    .eq("auth_user_id", uid)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: cabang } = await supabase
    .from("user_branches")
    .select("branch_id")
    .eq("user_id", data.id);

  return {
    id: data.id,
    name: data.name,
    role: data.role,
    is_active: data.is_active,
    branch_ids: (cabang ?? []).map((c) => c.branch_id),
  };
};

// Menu apa saja yang boleh dibuka tiap peran.
export const AKSES_HALAMAN: Record<string, string[]> = {
  owner: [
    "/",
    "/menu",
    "/cabang",
    "/pengguna",
    "/promo",
    "/meja",
    "/biaya",
    "/laporan-penjualan",
    "/laporan-keuangan",
    "/kontrol",
  ],
  manager: ["/", "/menu", "/meja", "/promo", "/biaya", "/laporan-penjualan", "/laporan-keuangan", "/kontrol"],
  akunting: ["/", "/biaya", "/laporan-penjualan", "/laporan-keuangan"],
  kasir: ["/", "/menu", "/meja"],
  waiter: ["/", "/menu", "/meja"],
  dapur: ["/menu"],
};

export const bolehBuka = (role: string | undefined, path: string): boolean =>
  !!role && (AKSES_HALAMAN[role] ?? []).includes(path);
