import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { unduhCsv } from "@/lib/csv";
import { LABEL_METODE, formatRupiah, formatTanggal, shiftIsoDate, todayWib } from "@/lib/format";
import {
  ambilBiaya,
  ambilCabang,
  ambilKategoriBiaya,
  hapusBiaya,
  simpanBiaya,
  type Expense,
} from "@/services/master-service";
import { useBranchStore } from "@/store/branch-store";

export const Route = createFileRoute("/biaya")({
  head: () => ({
    meta: [
      { title: "Biaya Operasional — Admin Empal Gentong" },
      { name: "description", content: "Catat dan pantau biaya operasional harian tiap cabang." },
    ],
  }),
  component: HalamanBiaya,
});

const METODE = ["tunai", "qris", "debit", "kartu_kredit"];

function HalamanBiaya() {
  const queryClient = useQueryClient();
  const { branchId } = useBranchStore();
  const hariIni = todayWib();
  const [from, setFrom] = useState(shiftIsoDate(hariIni, -29));
  const [to, setTo] = useState(hariIni);
  const [terbuka, setTerbuka] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({});
  const [filterKategori, setFilterKategori] = useState("semua");

  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });
  const { data: kategori = [] } = useQuery({
    queryKey: ["kategori-biaya"],
    queryFn: ambilKategoriBiaya,
  });
  const { data: biaya = [], isLoading } = useQuery({
    queryKey: ["biaya", branchId, from, to],
    queryFn: () => ambilBiaya(branchId, from, to),
  });

  const cabangAktif = useMemo(() => cabang.filter((c) => c.is_active), [cabang]);
  const namaCabang = useMemo(() => new Map(cabang.map((c) => [c.id, c.name])), [cabang]);
  const namaKategori = useMemo(() => new Map(kategori.map((k) => [k.id, k.name])), [kategori]);

  const terfilter = useMemo(
    () => (filterKategori === "semua" ? biaya : biaya.filter((b) => b.category_id === filterKategori)),
    [biaya, filterKategori],
  );

  const total = useMemo(() => terfilter.reduce((a, b) => a + Number(b.amount), 0), [terfilter]);
  const rataHarian = useMemo(() => {
    const hari = new Set(terfilter.map((b) => b.date)).size;
    return hari > 0 ? Math.round(total / hari) : 0;
  }, [terfilter, total]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["biaya"] });

  const simpan = useMutation({
    mutationFn: () => simpanBiaya(form),
    onSuccess: () => {
      invalidate();
      toast.success("Biaya tersimpan");
      setTerbuka(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => hapusBiaya(id),
    onSuccess: () => {
      invalidate();
      toast.success("Biaya dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bukaBaru = () => {
    setForm({
      branch_id: branchId ?? cabangAktif[0]?.id,
      category_id: kategori[0]?.id ?? null,
      date: hariIni,
      amount: 0,
      description: "",
      payment_method: "tunai",
    });
    setTerbuka(true);
  };

  const ekspor = () =>
    unduhCsv(
      `biaya-operasional-${from}-sd-${to}`,
      ["Tanggal", "Cabang", "Kategori", "Deskripsi", "Metode", "Jumlah"],
      terfilter.map((b) => [
        b.date,
        namaCabang.get(b.branch_id) ?? "-",
        namaKategori.get(b.category_id ?? "") ?? "-",
        b.description ?? "",
        LABEL_METODE[b.payment_method ?? ""] ?? b.payment_method ?? "",
        b.amount,
      ]),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya operasional"
        description="Catat pengeluaran harian agar laporan laba rugi mencerminkan keadaan sebenarnya."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={ekspor} disabled={terfilter.length === 0}>
              <Download className="size-4" />
              Ekspor CSV
            </Button>
            <Button onClick={bukaBaru}>
              <Plus className="size-4" />
              Catat biaya
            </Button>
          </div>
        }
      />

      <DateRangeFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total biaya" value={formatRupiah(total)} sublabel="Rentang terpilih" icon={Wallet} />
        <StatCard
          label="Rata-rata per hari"
          value={formatRupiah(rataHarian)}
          sublabel="Hari yang ada pengeluaran"
          icon={Receipt}
        />
        <StatCard
          label="Jumlah catatan"
          value={String(terfilter.length)}
          sublabel="Baris pengeluaran"
          icon={Receipt}
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Saring kategori</Label>
        <Select value={filterKategori} onValueChange={setFilterKategori}>
          <SelectTrigger className="w-full bg-card sm:w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua kategori</SelectItem>
            {kategori.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : terfilter.length === 0 ? (
            <div className="p-4">
              <EmptyState>Belum ada biaya tercatat pada rentang ini.</EmptyState>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Tanggal</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="w-[140px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terfilter.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="tabular-nums">{formatTanggal(b.date)}</TableCell>
                    <TableCell>{namaCabang.get(b.branch_id) ?? "-"}</TableCell>
                    <TableCell>{namaKategori.get(b.category_id ?? "") ?? "-"}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {b.description ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {LABEL_METODE[b.payment_method ?? ""] ?? b.payment_method ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatRupiah(b.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setForm(b);
                            setTerbuka(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={hapus.isPending}
                          onClick={() => hapus.mutate(b.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit biaya" : "Catat biaya"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Cabang</Label>
              <Select
                value={form.branch_id ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {cabangAktif.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={form.date ?? hariIni}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.category_id ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategori.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Metode pembayaran</Label>
              <Select
                value={form.payment_method ?? "tunai"}
                onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODE.map((m) => (
                    <SelectItem key={m} value={m}>
                      {LABEL_METODE[m] ?? m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="jumlah">Jumlah (Rp)</Label>
              <Input
                id="jumlah"
                type="number"
                min={0}
                step={1000}
                value={form.amount ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                rows={2}
                value={form.description ?? ""}
                placeholder="Belanja daging sapi 20 kg"
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerbuka(false)}>
              Batal
            </Button>
            <Button
              disabled={simpan.isPending}
              onClick={() => {
                if (!form.branch_id || !form.date || !Number(form.amount)) {
                  toast.error("Cabang, tanggal, dan jumlah wajib diisi");
                  return;
                }
                simpan.mutate();
              }}
            >
              {simpan.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
