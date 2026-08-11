import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ambilCabang, simpanCabang, type Branch } from "@/services/master-service";

export const Route = createFileRoute("/cabang")({
  head: () => ({
    meta: [
      { title: "Manajemen Cabang — Admin Empal Gentong" },
      { name: "description", content: "Kelola data cabang, tarif PB1, service charge, dan format struk." },
    ],
  }),
  component: HalamanCabang,
});

// Jumlah cabang dibatasi 3. Pembatas sesungguhnya ada di trigger database
// (batasi_jumlah_cabang), yang di bawah ini hanya agar tombolnya tidak menyesatkan.
const BATAS_CABANG = 3;

const kosong: Partial<Branch> = {
  code: "",
  name: "",
  address: "",
  phone: "",
  tax_rate: 10,
  service_charge_rate: 0,
  receipt_header: "",
  receipt_footer: "",
  is_active: true,
};

function HalamanCabang() {
  const queryClient = useQueryClient();
  const [terbuka, setTerbuka] = useState(false);
  const [form, setForm] = useState<Partial<Branch>>(kosong);

  const { data: cabang = [], isLoading } = useQuery({
    queryKey: ["cabang"],
    queryFn: ambilCabang,
  });

  const simpan = useMutation({
    mutationFn: (payload: Partial<Branch>) => simpanCabang(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabang"] });
      toast.success("Cabang tersimpan");
      setTerbuka(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const penuh = cabang.length >= BATAS_CABANG;

  const bukaBaru = () => {
    if (penuh) {
      toast.error(`Jumlah cabang dibatasi maksimal ${BATAS_CABANG}`);
      return;
    }
    setForm(kosong);
    setTerbuka(true);
  };

  const bukaEdit = (b: Branch) => {
    setForm(b);
    setTerbuka(true);
  };

  const kirim = () => {
    if (!form.code?.trim() || !form.name?.trim()) {
      toast.error("Kode dan nama cabang wajib diisi");
      return;
    }
    simpan.mutate(form);
  };

  const ubah = <K extends keyof Branch>(key: K, value: Branch[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen cabang"
        description="Data cabang, tarif pajak daerah, service charge, dan format struk."
        actions={
          <Button onClick={bukaBaru} disabled={penuh}>
            <Plus className="size-4" />
            Tambah cabang
          </Button>
        }
      />

      {penuh ? (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Batas cabang tercapai</AlertTitle>
          <AlertDescription>
            Sistem dibatasi maksimal {BATAS_CABANG} cabang dan saat ini sudah terisi semua. Cabang yang
            ada masih bisa diedit atau dinonaktifkan. Untuk menambah cabang keempat, batas ini perlu
            diubah lebih dulu di database.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : cabang.length === 0 ? (
            <div className="p-4">
              <EmptyState>Belum ada cabang. Tambahkan cabang pertama Anda.</EmptyState>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead className="text-right">PB1</TableHead>
                  <TableHead className="text-right">Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cabang.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.code}</TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {b.address ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.phone ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.tax_rate}%</TableCell>
                    <TableCell className="text-right tabular-nums">{b.service_charge_rate}%</TableCell>
                    <TableCell>
                      <Badge variant={b.is_active ? "default" : "secondary"}>
                        {b.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => bukaEdit(b)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit cabang" : "Tambah cabang"}</DialogTitle>
            <DialogDescription>
              Tarif PB1 dan service charge berlaku khusus untuk cabang ini.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="kode">Kode cabang</Label>
              <Input
                id="kode"
                value={form.code ?? ""}
                placeholder="CRB1"
                onChange={(e) => ubah("code", e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nama">Nama cabang</Label>
              <Input
                id="nama"
                value={form.name ?? ""}
                placeholder="Cabang Cirebon Kota"
                onChange={(e) => ubah("name", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={form.address ?? ""}
                onChange={(e) => ubah("address", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="telepon">Telepon</Label>
              <Input id="telepon" value={form.phone ?? ""} onChange={(e) => ubah("phone", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pb1">Tarif PB1 (%)</Label>
              <Input
                id="pb1"
                type="number"
                min={0}
                max={100}
                value={form.tax_rate ?? 0}
                onChange={(e) => ubah("tax_rate", Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Pajak daerah (PB1), tarifnya ditetapkan Perda tiap kabupaten/kota — bisa berbeda antar
                cabang.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="service">Service charge (%)</Label>
              <Input
                id="service"
                type="number"
                min={0}
                max={100}
                value={form.service_charge_rate ?? 0}
                onChange={(e) => ubah("service_charge_rate", Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="aktif"
                checked={form.is_active ?? true}
                onCheckedChange={(v) => ubah("is_active", v)}
              />
              <Label htmlFor="aktif">Cabang aktif</Label>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="header">Header struk</Label>
              <Textarea
                id="header"
                rows={3}
                value={form.receipt_header ?? ""}
                placeholder={"EMPAL GENTONG\nJl. Contoh No. 1, Cirebon"}
                onChange={(e) => ubah("receipt_header", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="footer">Footer struk</Label>
              <Textarea
                id="footer"
                rows={2}
                value={form.receipt_footer ?? ""}
                placeholder="Terima kasih atas kunjungan Anda"
                onChange={(e) => ubah("receipt_footer", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTerbuka(false)}>
              Batal
            </Button>
            <Button onClick={kirim} disabled={simpan.isPending}>
              {simpan.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
