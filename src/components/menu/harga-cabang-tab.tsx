import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatRupiah } from "@/lib/format";
import {
  ambilCabang,
  ambilHargaCabang,
  ambilKategori,
  ambilMenu,
  simpanHargaCabang,
  type BranchMenu,
} from "@/services/master-service";

export function HargaCabangTab() {
  const queryClient = useQueryClient();
  const [cari, setCari] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");

  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });
  const { data: kategori = [] } = useQuery({ queryKey: ["kategori"], queryFn: ambilKategori });
  const { data: menu = [], isLoading } = useQuery({ queryKey: ["menu"], queryFn: ambilMenu });
  const { data: hargaCabang = [] } = useQuery({
    queryKey: ["harga-cabang"],
    queryFn: ambilHargaCabang,
  });

  const cabangAktif = useMemo(() => cabang.filter((c) => c.is_active), [cabang]);
  const kategoriAktif = useMemo(() => kategori.filter((k) => k.is_active), [kategori]);

  const peta = useMemo(() => {
    const m = new Map<string, BranchMenu>();
    for (const h of hargaCabang) m.set(`${h.branch_id}|${h.menu_item_id}`, h);
    return m;
  }, [hargaCabang]);

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return menu
      .filter((m) => m.is_active)
      .filter((m) => filterKategori === "semua" || m.category_id === filterKategori)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || (m.sku ?? "").toLowerCase().includes(q));
  }, [menu, cari, filterKategori]);

  const simpan = useMutation({
    mutationFn: (payload: BranchMenu) => simpanHargaCabang(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harga-cabang"] });
      toast.success("Harga cabang diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const simpanHarga = (branchId: string, menuItemId: string, nilai: string) => {
    const lama = peta.get(`${branchId}|${menuItemId}`);
    const bersih = nilai.trim();
    const angka = bersih === "" ? null : Number(bersih);
    if (angka !== null && (Number.isNaN(angka) || angka < 0)) {
      toast.error("Harga harus berupa angka positif");
      return;
    }
    if ((lama?.price_override ?? null) === angka) return;
    simpan.mutate({
      branch_id: branchId,
      menu_item_id: menuItemId,
      price_override: angka,
      is_available: lama?.is_available ?? true,
    });
  };

  const ubahTersedia = (branchId: string, menuItemId: string, tersedia: boolean) => {
    const lama = peta.get(`${branchId}|${menuItemId}`);
    simpan.mutate({
      branch_id: branchId,
      menu_item_id: menuItemId,
      price_override: lama?.price_override ?? null,
      is_available: tersedia,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Cari menu</Label>
          <Input
            value={cari}
            placeholder="Nama atau SKU"
            className="w-[240px] bg-card"
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Kategori</Label>
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-[220px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua kategori</SelectItem>
              {kategoriAktif.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Kosongkan kolom harga berarti cabang mengikuti harga dasar. Perubahan tersimpan otomatis saat Anda
        pindah dari kolom. Menampilkan {terfilter.length} menu.
      </p>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : terfilter.length === 0 ? (
        <EmptyState>Tidak ada menu yang cocok.</EmptyState>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-md border border-border">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-20 bg-card">
              <tr className="border-b border-border">
                <th className="sticky left-0 z-30 min-w-[240px] bg-card px-3 py-2 text-left font-medium">
                  Menu
                </th>
                <th className="min-w-[110px] px-3 py-2 text-right font-medium">Harga dasar</th>
                {cabangAktif.map((c) => (
                  <th key={c.id} className="min-w-[200px] px-3 py-2 text-center font-medium">
                    {c.name}
                    <div className="text-xs font-normal text-muted-foreground">{c.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terfilter.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2">
                    <div className="font-medium">{m.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{m.sku ?? "-"}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {formatRupiah(m.base_price)}
                  </td>
                  {cabangAktif.map((c) => {
                    const row = peta.get(`${c.id}|${m.id}`);
                    return (
                      <td key={c.id} className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step={500}
                            defaultValue={row?.price_override ?? ""}
                            placeholder={String(m.base_price)}
                            className="h-8 w-[110px] bg-card text-right"
                            onBlur={(e) => simpanHarga(c.id, m.id, e.target.value)}
                          />
                          <Switch
                            checked={row?.is_available ?? true}
                            aria-label={`Tersedia di ${c.name}`}
                            onCheckedChange={(v) => ubahTersedia(c.id, m.id, v)}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
