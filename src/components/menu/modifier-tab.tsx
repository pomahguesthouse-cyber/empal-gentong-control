import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ambilGrupModifier,
  ambilModifier,
  hapusModifier,
  simpanGrupModifier,
  simpanModifier,
  type Modifier,
  type ModifierGroup,
} from "@/services/master-service";

export function ModifierTab() {
  const queryClient = useQueryClient();
  const [dialogGrup, setDialogGrup] = useState(false);
  const [dialogMod, setDialogMod] = useState(false);
  const [formGrup, setFormGrup] = useState<Partial<ModifierGroup>>({});
  const [formMod, setFormMod] = useState<Partial<Modifier>>({});

  const { data: grup = [], isLoading } = useQuery({
    queryKey: ["grup-modifier"],
    queryFn: ambilGrupModifier,
  });
  const { data: modifier = [] } = useQuery({ queryKey: ["modifier"], queryFn: ambilModifier });

  const perGrup = useMemo(() => {
    const m = new Map<string, Modifier[]>();
    for (const x of modifier) m.set(x.group_id, [...(m.get(x.group_id) ?? []), x]);
    return m;
  }, [modifier]);

  const simpanGrupMut = useMutation({
    mutationFn: () => simpanGrupModifier(formGrup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grup-modifier"] });
      toast.success("Grup modifier tersimpan");
      setDialogGrup(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const simpanModMut = useMutation({
    mutationFn: () => simpanModifier(formMod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier"] });
      toast.success("Modifier tersimpan");
      setDialogMod(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapusModMut = useMutation({
    mutationFn: (id: string) => hapusModifier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier"] });
      toast.success("Modifier dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Modifier adalah tambahan atau pilihan saat memesan, misalnya "Level Pedas" (wajib pilih 1) atau
          "Tambahan" (boleh pilih banyak).
        </p>
        <Button
          onClick={() => {
            setFormGrup({ name: "", min_select: 0, max_select: 1, is_required: false });
            setDialogGrup(true);
          }}
        >
          <Plus className="size-4" />
          Tambah grup
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : grup.length === 0 ? (
        <EmptyState>Belum ada grup modifier.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {grup.map((g) => {
            const isi = perGrup.get(g.id) ?? [];
            return (
              <Card key={g.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        Pilih {g.min_select}–{g.max_select}
                      </Badge>
                      <Badge variant={g.is_required ? "default" : "secondary"} className="text-xs">
                        {g.is_required ? "Wajib" : "Opsional"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormGrup(g);
                        setDialogGrup(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormMod({ group_id: g.id, name: "", price_delta: 0 });
                        setDialogMod(true);
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isi.length === 0 ? (
                    <EmptyState>Belum ada pilihan di grup ini.</EmptyState>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pilihan</TableHead>
                          <TableHead className="text-right">Tambahan harga</TableHead>
                          <TableHead className="w-[120px] text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isi.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {m.price_delta === 0
                                ? "—"
                                : (m.price_delta > 0 ? "+" : "") + formatRupiah(m.price_delta)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setFormMod(m);
                                    setDialogMod(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  disabled={hapusModMut.isPending}
                                  onClick={() => hapusModMut.mutate(m.id)}
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
            );
          })}
        </div>
      )}

      <Dialog open={dialogGrup} onOpenChange={setDialogGrup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{formGrup.id ? "Edit grup modifier" : "Tambah grup modifier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nama-grup">Nama grup</Label>
              <Input
                id="nama-grup"
                value={formGrup.name ?? ""}
                placeholder="Level Pedas"
                onChange={(e) => setFormGrup((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="min">Minimal pilih</Label>
                <Input
                  id="min"
                  type="number"
                  min={0}
                  value={formGrup.min_select ?? 0}
                  onChange={(e) => setFormGrup((f) => ({ ...f, min_select: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="max">Maksimal pilih</Label>
                <Input
                  id="max"
                  type="number"
                  min={1}
                  value={formGrup.max_select ?? 1}
                  onChange={(e) => setFormGrup((f) => ({ ...f, max_select: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="wajib"
                checked={formGrup.is_required ?? false}
                onCheckedChange={(v) => setFormGrup((f) => ({ ...f, is_required: v }))}
              />
              <Label htmlFor="wajib">Wajib dipilih</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogGrup(false)}>
              Batal
            </Button>
            <Button
              disabled={simpanGrupMut.isPending}
              onClick={() => {
                if (!formGrup.name?.trim()) {
                  toast.error("Nama grup wajib diisi");
                  return;
                }
                simpanGrupMut.mutate();
              }}
            >
              {simpanGrupMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMod} onOpenChange={setDialogMod}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{formMod.id ? "Edit pilihan" : "Tambah pilihan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Grup</Label>
              <Select
                value={formMod.group_id ?? ""}
                onValueChange={(v) => setFormMod((f) => ({ ...f, group_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih grup" />
                </SelectTrigger>
                <SelectContent>
                  {grup.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nama-mod">Nama pilihan</Label>
              <Input
                id="nama-mod"
                value={formMod.name ?? ""}
                placeholder="Extra Daging"
                onChange={(e) => setFormMod((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="delta-mod">Tambahan harga (Rp)</Label>
              <Input
                id="delta-mod"
                type="number"
                step={500}
                value={formMod.price_delta ?? 0}
                onChange={(e) => setFormMod((f) => ({ ...f, price_delta: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMod(false)}>
              Batal
            </Button>
            <Button
              disabled={simpanModMut.isPending}
              onClick={() => {
                if (!formMod.name?.trim() || !formMod.group_id) {
                  toast.error("Grup dan nama pilihan wajib diisi");
                  return;
                }
                simpanModMut.mutate();
              }}
            >
              {simpanModMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
