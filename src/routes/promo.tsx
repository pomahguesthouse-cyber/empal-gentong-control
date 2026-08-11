import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NAMA_HARI, formatRupiah, formatTanggal } from "@/lib/format";
import {
  ambilCabang,
  ambilPromo,
  ambilPromoCabang,
  simpanPromo,
  type Promo,
} from "@/services/master-service";

export const Route = createFileRoute("/promo")({
  head: () => ({
    meta: [
      { title: "Promo & Diskon — Admin Empal Gentong" },
      { name: "description", content: "Kelola promo, cabang yang berlaku, serta hari dan jam aktif." },
    ],
  }),
  component: HalamanPromo,
});

const kosong: Partial<Promo> = {
  name: "",
  type: "percent",
  value: 0,
  min_purchase: 0,
  valid_from: null,
  valid_to: null,
  active_days: [0, 1, 2, 3, 4, 5, 6],
  active_hours_start: null,
  active_hours_end: null,
  is_active: true,
};

function HalamanPromo() {
  const queryClient = useQueryClient();
  const [terbuka, setTerbuka] = useState(false);
  const [form, setForm] = useState<Partial<Promo>>(kosong);
  const [cabangDipilih, setCabangDipilih] = useState<string[]>([]);

  const { data: promo = [], isLoading } = useQuery({ queryKey: ["promo"], queryFn: ambilPromo });
  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });
  const { data: promoCabang = [] } = useQuery({
    queryKey: ["promo-cabang"],
    queryFn: ambilPromoCabang,
  });

  const namaCabang = useMemo(() => new Map(cabang.map((c) => [c.id, c.name])), [cabang]);
  const cabangPerPromo = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of promoCabang) m.set(p.promo_id, [...(m.get(p.promo_id) ?? []), p.branch_id]);
    return m;
  }, [promoCabang]);

  const simpan = useMutation({
    mutationFn: () => simpanPromo(form, cabangDipilih),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo"] });
      queryClient.invalidateQueries({ queryKey: ["promo-cabang"] });
      toast.success("Promo tersimpan");
      setTerbuka(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bukaBaru = () => {
    setForm(kosong);
    setCabangDipilih([]);
    setTerbuka(true);
  };

  const bukaEdit = (p: Promo) => {
    setForm(p);
    setCabangDipilih(cabangPerPromo.get(p.id) ?? []);
    setTerbuka(true);
  };

  const toggleHari = (h: number, on: boolean) =>
    setForm((f) => {
      const set = new Set(f.active_days ?? []);
      if (on) set.add(h);
      else set.delete(h);
      return { ...f, active_days: [...set].sort((a, b) => a - b) };
    });

  const nilaiPromo = (p: Promo) =>
    p.type === "percent" ? `${p.value}%` : formatRupiah(p.value);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo & diskon"
        description="Atur potongan harga, cabang yang berlaku, serta hari dan jam aktif."
        actions={
          <Button onClick={bukaBaru}>
            <Plus className="size-4" />
            Tambah promo
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : promo.length === 0 ? (
            <div className="p-4">
              <EmptyState>Belum ada promo. Buat promo pertama Anda.</EmptyState>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama promo</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead className="text-right">Min. belanja</TableHead>
                  <TableHead>Berlaku</TableHead>
                  <TableHead>Hari &amp; jam</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promo.map((p) => {
                  const ids = cabangPerPromo.get(p.id) ?? [];
                  const hari = p.active_days ?? [];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {p.type === "percent" ? "Persen" : "Potongan tetap"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{nilaiPromo(p)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.min_purchase > 0 ? formatRupiah(p.min_purchase) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.valid_from || p.valid_to
                          ? `${formatTanggal(p.valid_from)} – ${formatTanggal(p.valid_to)}`
                          : "Tanpa batas"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {hari.length === 7 || hari.length === 0
                          ? "Setiap hari"
                          : hari.map((h) => NAMA_HARI[h]?.slice(0, 3)).join(", ")}
                        {p.active_hours_start && p.active_hours_end
                          ? ` · ${p.active_hours_start.slice(0, 5)}–${p.active_hours_end.slice(0, 5)}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {ids.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Semua cabang</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {ids.map((id) => (
                              <Badge key={id} variant="outline" className="text-xs">
                                {namaCabang.get(id) ?? id}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => bukaEdit(p)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit promo" : "Tambah promo"}</DialogTitle>
            <DialogDescription>
              Kosongkan pilihan cabang bila promo berlaku di semua cabang.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="nama">Nama promo</Label>
              <Input
                id="nama"
                value={form.name ?? ""}
                placeholder="Diskon Makan Siang"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Jenis potongan</Label>
              <Select value={form.type ?? "percent"} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Persen (%)</SelectItem>
                  <SelectItem value="fixed">Potongan tetap (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nilai">Nilai {form.type === "percent" ? "(%)" : "(Rp)"}</Label>
              <Input
                id="nilai"
                type="number"
                min={0}
                value={form.value ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="min">Minimal belanja (Rp)</Label>
              <Input
                id="min"
                type="number"
                min={0}
                step={1000}
                value={form.min_purchase ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, min_purchase: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="promo-aktif"
                checked={form.is_active ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="promo-aktif">Promo aktif</Label>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dari">Berlaku dari</Label>
              <Input
                id="dari"
                type="date"
                value={form.valid_from ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value || null }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sampai">Berlaku sampai</Label>
              <Input
                id="sampai"
                type="date"
                value={form.valid_to ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, valid_to: e.target.value || null }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="jam-mulai">Jam mulai</Label>
              <Input
                id="jam-mulai"
                type="time"
                value={form.active_hours_start?.slice(0, 5) ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active_hours_start: e.target.value || null }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="jam-selesai">Jam selesai</Label>
              <Input
                id="jam-selesai"
                type="time"
                value={form.active_hours_end?.slice(0, 5) ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, active_hours_end: e.target.value || null }))}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Hari aktif</Label>
              <div className="flex flex-wrap gap-3 rounded-md border border-border p-3">
                {NAMA_HARI.map((nama, i) => (
                  <label key={nama} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(form.active_days ?? []).includes(i)}
                      onCheckedChange={(v) => toggleHari(i, v === true)}
                    />
                    <span>{nama}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Cabang yang berlaku</Label>
              <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                {cabang.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={cabangDipilih.includes(c.id)}
                      onCheckedChange={(v) =>
                        setCabangDipilih((prev) =>
                          v === true ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                        )
                      }
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTerbuka(false)}>
              Batal
            </Button>
            <Button
              disabled={simpan.isPending}
              onClick={() => {
                if (!form.name?.trim()) {
                  toast.error("Nama promo wajib diisi");
                  return;
                }
                if (form.type === "percent" && Number(form.value) > 100) {
                  toast.error("Diskon persen tidak boleh lebih dari 100%");
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
