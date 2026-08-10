// Ekspor data tabel ke berkas CSV (pemisah titik koma agar cocok dengan Excel Indonesia)
export const unduhCsv = (
  namaBerkas: string,
  kolom: string[],
  baris: (string | number | null | undefined)[][],
): void => {
  const escape = (v: string | number | null | undefined): string => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const isi = [kolom.map(escape).join(";"), ...baris.map((r) => r.map(escape).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + isi], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${namaBerkas}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};