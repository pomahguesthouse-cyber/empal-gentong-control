import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
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
import { formatRupiah } from "@/lib/format";
import {
  ambilMenu,
  ambilVarian,
  hapusVarian,
  simpanVarian,
  type MenuVariant,
} from "@/services/master-service";

export function VarianTab() {
  const queryClient = useQueryClient();
  const [menuId, setMenuId] = useState<string>("");
  const [terbuka, setTerbuka] = useState(false);
  const [form, setForm] = useState<Partial<MenuVariant>>({});

  const { data: menu = [] } = useQuery({ queryKey: ["menu"], queryFn: ambilMenu });
  const { data: varian = [], isLoading } = useQuery({ queryKey: ["varian"], queryFn: ambilVarian });

  const menuAktif = useMemo(() => menu.filter((m) => m.is_active), [menu]);
  const jumlahVarian = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of varian) m.set(v.menu_item_id, (m.get(v.menu_item_id) ?? 0) + 1);
    return m;
  }, [varian]);

  const dipilih = menuId || menuAktif[0]?.id || "";
  const menuTerpilih = menu.find((m) => m.id === dipilih);
  const daftar = useMemo(
    () => varian.filter((v) => v.menu_item_id === dipilih),
    [varian, dipilih],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["varian"] });

  const simpan = useMutation({
    mutationFn: () => simpanVarian({ ...form, menu_item_id: dipilih }),
    onSuccess: () => {
      invalidate();
      toast.success("Varian tersimpan");
      setTerbuka(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => hapusVarian(id),
    onSuccess: () => {
      invalidate();
      toast.success("Varian dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Pilih menu</Label>
          <Select value={dipilih} onValueChange={setMenuId}>
            <SelectTrigger className="w-full bg-card sm:w-[320px]">
              <SelectValue placeholder="Pilih menu" />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {menuAktif.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {jumlahVarian.get(m.id) ? ` (${jumlahVarian.get(m.id)} varian)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          disabled={!dipilih}
          onClick={() => {
            setForm({ name: "", price_delta: 0, is_default: false });
            setTerbuka(true);
          }}
        >
          <Plus className="size-4" />
          Tambah varian
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Varian adalah pilihan yang tidak mengubah menu, misalnya Goreng / Bakar atau Es / Panas / Hangat.
        Selisih harga boleh 0.
      </p>

      {isLoading ? (
        <TableSkeleton />
      ) : !dipilih ? (
        <EmptyState>Pilih menu terlebih dahulu.</EmptyState>
      ) : daftar.length === 0 ? (
        <EmptyState>{menuTerpilih?.name ?? "Menu ini"} belum punya varian.</EmptyState>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama varian</TableHead>
                <TableHead className="text-right">Selisih harga</TableHead>
                <TableHead className="text-right">Harga jadi</TableHead>
                <TableHead className="w-[100px]">Default</TableHead>
                <TableHead className="w-[140px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftar.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.price_delta === 0
                      ? "—"
                      : (v.price_delta > 0 ? "+" : "") + formatRupiah(v.price_delta)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatRupiah((menuTerpilih?.base_price ?? 0) + v.price_delta)}
                  </TableCell>
                  <TableCell>{v.is_default ? <Badge>Default</Badge> : null}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setForm(v);
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
                        onClick={() => hapus.mutate(v.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit varian" : "Tambah varian"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nama-varian">Nama varian</Label>
              <Input
                id="nama-varian"
                value={form.name ?? ""}
                placeholder="Bakar"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="delta">Selisih harga (Rp)</Label>
              <Input
                id="delta"
                type="number"
                step={500}
                value={form.price_delta ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, price_delta: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Boleh negatif, misalnya -5000 untuk tanpa nasi.</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="default-varian"
                checked={form.is_default ?? false}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_default: v }))}
              />
              <Label htmlFor="default-varian">Jadikan pilihan default</Label>
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
                  toast.error("Nama varian wajib diisi");
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
