import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/format";
import {
  ambilHargaChannel,
  ambilKategori,
  ambilMenu,
  hapusHargaChannel,
  simpanHargaChannel,
} from "@/services/master-service";

const CHANNEL = [
  { id: "gofood", label: "GoFood" },
  { id: "grabfood", label: "GrabFood" },
] as const;

export function HargaOjolTab() {
  const queryClient = useQueryClient();
  const [cari, setCari] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [komisi, setKomisi] = useState(20);
  const [hanyaTerdaftar, setHanyaTerdaftar] = useState("semua");

  const { data: kategori = [] } = useQuery({ queryKey: ["kategori"], queryFn: ambilKategori });
  const { data: menu = [], isLoading } = useQuery({ queryKey: ["menu"], queryFn: ambilMenu });
  const { data: hargaChannel = [] } = useQuery({
    queryKey: ["harga-channel"],
    queryFn: ambilHargaChannel,
  });

  const kategoriAktif = useMemo(() => kategori.filter((k) => k.is_active), [kategori]);

  const peta = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of hargaChannel) if (h.is_active) m.set(`${h.channel}|${h.menu_item_id}`, h.price);
    return m;
  }, [hargaChannel]);

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return menu
      .filter((m) => m.is_active)
      .filter((m) => filterKategori === "semua" || m.category_id === filterKategori)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || (m.sku ?? "").toLowerCase().includes(q))
      .filter((m) => {
        if (hanyaTerdaftar === "semua") return true;
        const ada = CHANNEL.some((c) => peta.has(`${c.id}|${m.id}`));
        return hanyaTerdaftar === "terdaftar" ? ada : !ada;
      });
  }, [menu, cari, filterKategori, hanyaTerdaftar, peta]);

  const jumlahTerdaftar = useMemo(
    () => ({
      gofood: hargaChannel.filter((h) => h.channel === "gofood" && h.is_active).length,
      grabfood: hargaChannel.filter((h) => h.channel === "grabfood" && h.is_active).length,
    }),
    [hargaChannel],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["harga-channel"] });

  const simpan = useMutation({
    mutationFn: (v: { id: string; channel: string; price: number }) =>
      simpanHargaChannel(v.id, v.channel, v.price),
    onSuccess: () => {
      invalidate();
      toast.success("Harga ojol diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: (v: { id: string; channel: string }) => hapusHargaChannel(v.id, v.channel),
    onSuccess: () => {
      invalidate();
      toast.success("Menu ditarik dari channel tersebut");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Harga yang menutup komisi: harga dasar dibagi (1 - komisi).
  const saran = (hargaDasar: number): number => {
    const sisa = 1 - komisi / 100;
    if (sisa <= 0) return hargaDasar;
    return Math.ceil((hargaDasar / sisa) / 25) * 25;
  };

  const simpanSel = (menuItemId: string, channel: string, hargaDasar: number, nilai: string) => {
    const bersih = nilai.trim();
    const lama = peta.get(`${channel}|${menuItemId}`);

    if (bersih === "") {
      if (lama !== undefined) hapus.mutate({ id: menuItemId, channel });
      return;
    }
    const angka = Number(bersih);
    if (Number.isNaN(angka) || angka <= 0) {
      toast.error("Harga harus berupa angka lebih dari nol");
      return;
    }
    if (angka === lama) return;
    if (angka < hargaDasar) {
      toast.warning("Harga ojol lebih rendah dari harga dasar — komisi akan menggerus margin");
    }
    simpan.mutate({ id: menuItemId, channel, price: angka });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Cari menu</Label>
          <Input
            value={cari}
            placeholder="Nama atau SKU"
            className="w-full bg-card sm:w-[220px]"
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Kategori</Label>
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-full bg-card sm:w-[200px]">
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
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Tampilkan</Label>
          <Select value={hanyaTerdaftar} onValueChange={setHanyaTerdaftar}>
            <SelectTrigger className="w-full bg-card sm:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua menu</SelectItem>
              <SelectItem value="terdaftar">Sudah ada di ojol</SelectItem>
              <SelectItem value="belum">Belum ada di ojol</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="komisi" className="text-xs text-muted-foreground">
            Asumsi komisi (%)
          </Label>
          <Input
            id="komisi"
            type="number"
            min={0}
            max={90}
            value={komisi}
            className="w-full bg-card sm:w-[120px]"
            onChange={(e) => setKomisi(Math.min(90, Math.max(0, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">GoFood: {jumlahTerdaftar.gofood} menu</Badge>
        <Badge variant="outline">GrabFood: {jumlahTerdaftar.grabfood} menu</Badge>
        <span>
          Kosongkan kolom untuk menarik menu dari channel itu. Tersimpan otomatis saat kursor pindah.
        </span>
      </div>

      <p className="rounded-md border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
        Kolom <strong>saran</strong> dihitung dari harga dasar dibagi (100% − komisi), dibulatkan ke atas
        per Rp 25. Dengan komisi {komisi}%, harga itu membuat uang yang Anda terima setelah potongan
        kira-kira sama dengan harga dasar. Angka ini hanya usulan — harga akhir tetap keputusan Anda.
      </p>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : terfilter.length === 0 ? (
        <EmptyState>Tidak ada menu yang cocok dengan penyaring ini.</EmptyState>
      ) : (
        <div className="max-h-[65vh] overflow-auto overscroll-contain rounded-md border border-border">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-20 bg-card">
              <tr className="border-b border-border">
                <th className="sticky left-0 z-30 min-w-[150px] bg-card px-3 py-2 text-left font-medium sm:min-w-[230px]">
                  Menu
                </th>
                <th className="min-w-[100px] px-3 py-2 text-right font-medium">Harga dasar</th>
                <th className="min-w-[90px] px-3 py-2 text-right font-medium">Saran</th>
                {CHANNEL.map((c) => (
                  <th key={c.id} className="min-w-[170px] px-3 py-2 text-center font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terfilter.map((m) => {
                const usul = saran(m.base_price);
                return (
                  <tr key={m.id} className="border-b border-border/60 last:border-0">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2">
                      <div className="font-medium">{m.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{m.sku ?? "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {formatRupiah(m.base_price)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">
                      {formatRupiah(usul)}
                    </td>
                    {CHANNEL.map((c) => {
                      const harga = peta.get(`${c.id}|${m.id}`);
                      const markup =
                        harga && m.base_price > 0
                          ? ((harga - m.base_price) / m.base_price) * 100
                          : null;
                      return (
                        <td key={c.id} className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              min={0}
                              step={25}
                              defaultValue={harga ?? ""}
                              placeholder={String(usul)}
                              className="h-8 w-[110px] bg-card text-right"
                              onBlur={(e) => simpanSel(m.id, c.id, m.base_price, e.target.value)}
                            />
                            <span
                              className={
                                markup === null
                                  ? "w-[52px] text-right text-xs text-muted-foreground"
                                  : markup < komisi
                                    ? "w-[52px] text-right text-xs font-medium text-destructive"
                                    : "w-[52px] text-right text-xs text-muted-foreground"
                              }
                              title={
                                markup === null
                                  ? "Belum dijual di channel ini"
                                  : markup < komisi
                                    ? `Markup ${markup.toFixed(1)}% di bawah komisi ${komisi}%`
                                    : `Markup ${markup.toFixed(1)}%`
                              }
                            >
                              {markup === null ? "—" : `+${markup.toFixed(0)}%`}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
