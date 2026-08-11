import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/format";
import {
  ambilKategori,
  ambilMenu,
  simpanKategori,
  simpanMenu,
  type Category,
  type MenuItem,
} from "@/services/master-service";

const menuKosong: Partial<MenuItem> = {
  name: "",
  sku: "",
  description: "",
  base_price: 0,
  sort_order: 0,
  is_active: true,
};

const kategoriKosong: Partial<Category> = { name: "", sort_order: 0, is_active: true };

export function KatalogTab() {
  const queryClient = useQueryClient();
  const [cari, setCari] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [dialogMenu, setDialogMenu] = useState(false);
  const [dialogKategori, setDialogKategori] = useState(false);
  const [formMenu, setFormMenu] = useState<Partial<MenuItem>>(menuKosong);
  const [formKategori, setFormKategori] = useState<Partial<Category>>(kategoriKosong);

  const { data: kategori = [] } = useQuery({ queryKey: ["kategori"], queryFn: ambilKategori });
  const { data: menu = [], isLoading } = useQuery({ queryKey: ["menu"], queryFn: ambilMenu });

  const kategoriAktif = useMemo(() => kategori.filter((k) => k.is_active), [kategori]);
  const namaKategori = useMemo(() => new Map(kategori.map((k) => [k.id, k.name])), [kategori]);

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return menu.filter((m) => {
      if (filterKategori !== "semua" && m.category_id !== filterKategori) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || (m.sku ?? "").toLowerCase().includes(q);
    });
  }, [menu, cari, filterKategori]);

  const perKategori = useMemo(() => {
    const grup = new Map<string, MenuItem[]>();
    for (const m of terfilter) {
      const key = m.category_id ?? "tanpa-kategori";
      grup.set(key, [...(grup.get(key) ?? []), m]);
    }
    const urutan = new Map(kategori.map((k, i) => [k.id, k.sort_order * 1000 + i]));
    return [...grup.entries()].sort(
      (a, b) => (urutan.get(a[0]) ?? 9e9) - (urutan.get(b[0]) ?? 9e9),
    );
  }, [terfilter, kategori]);

  const simpanMenuMut = useMutation({
    mutationFn: () => simpanMenu(formMenu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu tersimpan");
      setDialogMenu(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const simpanKategoriMut = useMutation({
    mutationFn: () => simpanKategori(formKategori),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kategori"] });
      toast.success("Kategori tersimpan");
      setDialogKategori(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFormKategori(kategoriKosong);
              setDialogKategori(true);
            }}
          >
            <Plus className="size-4" />
            Kategori
          </Button>
          <Button
            onClick={() => {
              setFormMenu({ ...menuKosong, category_id: kategoriAktif[0]?.id ?? null });
              setDialogMenu(true);
            }}
          >
            <Plus className="size-4" />
            Tambah menu
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan {terfilter.length} dari {menu.length} menu.
      </p>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : terfilter.length === 0 ? (
        <EmptyState>Tidak ada menu yang cocok dengan pencarian.</EmptyState>
      ) : (
        <div className="space-y-6">
          {perKategori.map(([katId, items]) => {
            const kat = kategori.find((k) => k.id === katId);
            return (
              <div key={katId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {namaKategori.get(katId) ?? "Tanpa kategori"}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {items.length} menu
                  </Badge>
                  {kat ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setFormKategori(kat);
                        setDialogKategori(true);
                      }}
                    >
                      Edit kategori
                    </Button>
                  ) : null}
                </div>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">SKU</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead className="text-right">Harga dasar</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[90px] text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {m.sku ?? "-"}
                          </TableCell>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(m.base_price)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.is_active ? "default" : "secondary"}>
                              {m.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormMenu(m);
                                setDialogMenu(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogMenu} onOpenChange={setDialogMenu}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMenu.id ? "Edit menu" : "Tambah menu"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Kategori</Label>
              <Select
                value={formMenu.category_id ?? ""}
                onValueChange={(v) => setFormMenu((f) => ({ ...f, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriAktif.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formMenu.sku ?? ""}
                  placeholder="EG-PKT-001"
                  onChange={(e) => setFormMenu((f) => ({ ...f, sku: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="urutan">Urutan tampil</Label>
                <Input
                  id="urutan"
                  type="number"
                  value={formMenu.sort_order ?? 0}
                  onChange={(e) => setFormMenu((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nama-menu">Nama menu</Label>
              <Input
                id="nama-menu"
                value={formMenu.name ?? ""}
                onChange={(e) => setFormMenu((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="harga">Harga dasar (Rp)</Label>
              <Input
                id="harga"
                type="number"
                min={0}
                step={500}
                value={formMenu.base_price ?? 0}
                onChange={(e) => setFormMenu((f) => ({ ...f, base_price: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Rupiah penuh tanpa desimal. Harga khusus per cabang diatur di tab "Harga per cabang".
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                rows={2}
                value={formMenu.description ?? ""}
                onChange={(e) => setFormMenu((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="menu-aktif"
                checked={formMenu.is_active ?? true}
                onCheckedChange={(v) => setFormMenu((f) => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="menu-aktif">Menu aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMenu(false)}>
              Batal
            </Button>
            <Button
              disabled={simpanMenuMut.isPending}
              onClick={() => {
                if (!formMenu.name?.trim()) {
                  toast.error("Nama menu wajib diisi");
                  return;
                }
                simpanMenuMut.mutate();
              }}
            >
              {simpanMenuMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogKategori} onOpenChange={setDialogKategori}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{formKategori.id ? "Edit kategori" : "Tambah kategori"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nama-kat">Nama kategori</Label>
              <Input
                id="nama-kat"
                value={formKategori.name ?? ""}
                onChange={(e) => setFormKategori((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="urutan-kat">Urutan tampil</Label>
              <Input
                id="urutan-kat"
                type="number"
                value={formKategori.sort_order ?? 0}
                onChange={(e) =>
                  setFormKategori((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="kat-aktif"
                checked={formKategori.is_active ?? true}
                onCheckedChange={(v) => setFormKategori((f) => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="kat-aktif">Kategori aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogKategori(false)}>
              Batal
            </Button>
            <Button
              disabled={simpanKategoriMut.isPending}
              onClick={() => {
                if (!formKategori.name?.trim()) {
                  toast.error("Nama kategori wajib diisi");
                  return;
                }
                simpanKategoriMut.mutate();
              }}
            >
              {simpanKategoriMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
