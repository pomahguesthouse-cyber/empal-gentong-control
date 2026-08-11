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
import { LABEL_PERAN } from "@/lib/format";
import {
  ambilAksesCabang,
  ambilCabang,
  ambilPengguna,
  simpanPengguna,
  type AppUser,
} from "@/services/master-service";

export const Route = createFileRoute("/pengguna")({
  head: () => ({
    meta: [
      { title: "User & Hak Akses — Admin Empal Gentong" },
      { name: "description", content: "Kelola pengguna, peran, dan cabang yang boleh diakses." },
    ],
  }),
  component: HalamanPengguna,
});

const PERAN = ["owner", "manager", "kasir", "waiter", "dapur", "akunting"];

const kosong: Partial<AppUser> = { name: "", phone: "", email: "", role: "kasir", is_active: true };

function HalamanPengguna() {
  const queryClient = useQueryClient();
  const [terbuka, setTerbuka] = useState(false);
  const [form, setForm] = useState<Partial<AppUser>>(kosong);
  const [cabangDipilih, setCabangDipilih] = useState<string[]>([]);
  const [filterPeran, setFilterPeran] = useState("semua");

  const { data: pengguna = [], isLoading } = useQuery({ queryKey: ["pengguna"], queryFn: ambilPengguna });
  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });
  const { data: akses = [] } = useQuery({ queryKey: ["akses-cabang"], queryFn: ambilAksesCabang });

  const namaCabang = useMemo(
    () => new Map(cabang.map((c) => [c.id, c.name])),
    [cabang],
  );

  const aksesPerUser = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of akses) m.set(a.user_id, [...(m.get(a.user_id) ?? []), a.branch_id]);
    return m;
  }, [akses]);

  const terfilter = useMemo(
    () => (filterPeran === "semua" ? pengguna : pengguna.filter((u) => u.role === filterPeran)),
    [pengguna, filterPeran],
  );

  const simpan = useMutation({
    mutationFn: () => simpanPengguna(form, cabangDipilih),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengguna"] });
      queryClient.invalidateQueries({ queryKey: ["akses-cabang"] });
      toast.success("Pengguna tersimpan");
      setTerbuka(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bukaBaru = () => {
    setForm(kosong);
    setCabangDipilih([]);
    setTerbuka(true);
  };

  const bukaEdit = (u: AppUser) => {
    setForm(u);
    setCabangDipilih(aksesPerUser.get(u.id) ?? []);
    setTerbuka(true);
  };

  const kirim = () => {
    if (!form.name?.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    simpan.mutate();
  };

  const toggleCabang = (id: string, on: boolean) =>
    setCabangDipilih((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & hak akses"
        description="Siapa yang boleh masuk, dengan peran apa, dan ke cabang mana saja."
        actions={
          <Button onClick={bukaBaru}>
            <Plus className="size-4" />
            Tambah pengguna
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Saring peran</Label>
          <Select value={filterPeran} onValueChange={setFilterPeran}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua peran</SelectItem>
              {PERAN.map((p) => (
                <SelectItem key={p} value={p}>
                  {LABEL_PERAN[p] ?? p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : terfilter.length === 0 ? (
            <div className="p-4">
              <EmptyState>Tidak ada pengguna dengan peran ini.</EmptyState>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Akses cabang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terfilter.map((u) => {
                  const ids = aksesPerUser.get(u.id) ?? [];
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{LABEL_PERAN[u.role] ?? u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.phone ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email ?? "-"}</TableCell>
                      <TableCell>
                        {ids.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Belum ada</span>
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
                        <Badge variant={u.is_active ? "default" : "secondary"}>
                          {u.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => bukaEdit(u)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit pengguna" : "Tambah pengguna"}</DialogTitle>
            <DialogDescription>Peran menentukan menu apa saja yang bisa dibuka.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Peran</Label>
              <Select
                value={form.role ?? "kasir"}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERAN.map((p) => (
                    <SelectItem key={p} value={p}>
                      {LABEL_PERAN[p] ?? p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cabang yang bisa diakses</Label>
              <div className="grid gap-2 rounded-md border border-border p-3">
                {cabang.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={cabangDipilih.includes(c.id)}
                      onCheckedChange={(v) => toggleCabang(c.id, v === true)}
                    />
                    <span>
                      {c.name} <span className="text-xs text-muted-foreground">({c.code})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="aktif"
                checked={form.is_active ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="aktif">Pengguna aktif</Label>
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
