// Utilitas format angka & tanggal Indonesia
export const formatRupiah = (value: number | null | undefined): string => {
  const n = Number(value ?? 0);
  return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
};

export const formatRupiahShort = (value: number | null | undefined): string => {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1).replace(".", ",") + " M";
  if (Math.abs(n) >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1).replace(".", ",") + " jt";
  if (Math.abs(n) >= 1_000) return "Rp " + Math.round(n / 1_000) + " rb";
  return "Rp " + n;
};

export const formatNumber = (value: number | null | undefined): string =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value ?? 0));

export const formatDecimal = (value: number | null | undefined, digits = 1): string =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    Number(value ?? 0),
  );

// Tanggal singkat: 09/08/2026
export const formatTanggal = (input: string | Date | null | undefined): string => {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
};

// Tanggal panjang: 9 Agustus 2026
export const formatTanggalPanjang = (input: string | Date | null | undefined): string => {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
};

// Tanggal + jam WIB
export const formatWaktu = (input: string | Date | null | undefined): string => {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(d) + " WIB"
  );
};

export const formatJam = (input: string | Date | null | undefined): string => {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(d) + " WIB"
  );
};

// Tanggal ISO (yyyy-mm-dd) menurut WIB, dipakai untuk filter laporan
export const toIsoDate = (d: Date): string => {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
};

export const todayWib = (): string => toIsoDate(new Date());

export const shiftIsoDate = (iso: string, days: number): string => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const LABEL_METODE: Record<string, string> = {
  tunai: "Tunai",
  qris: "QRIS",
  debit: "Kartu Debit",
  kartu_kredit: "Kartu Kredit",
  gofood: "GoFood",
  grabfood: "GrabFood",
  shopeefood: "ShopeeFood",
};

export const LABEL_TIPE_PESANAN: Record<string, string> = {
  dine_in: "Makan di tempat",
  takeaway: "Bungkus",
  delivery: "Antar / Ojol",
};

export const LABEL_PERAN: Record<string, string> = {
  owner: "Pemilik",
  manager: "Manajer",
  kasir: "Kasir",
  waiter: "Pramusaji",
  dapur: "Dapur",
  akunting: "Akunting",
};