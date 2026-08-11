import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
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
import { ambilCabang, ambilMeja, hapusMeja, simpanMeja, type RestoTable } from "@/services/master-service";
import { useBranchStore } from "@/store/branch-store";

export const Route = createFileRoute("/meja")({
  head: () => ({
    meta: [
      { title: "Manajemen Meja — Admin Empal Gentong" },
      { name: "description", content: "Daftar meja tiap cabang, dikelompokkan per area." },
    ],
  }),
  component: HalamanMeja,
});

function HalamanMeja() {
  const queryClient = useQueryClient();
  const { branchId } = useBranchStore();
  const [terbuka, setTerbuka] = useState(false);
  const [form, setForm] = useState<Partial<RestoTable>>({});

  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });
  const { data: meja = [], isLoading } = useQuery({
    queryKey: ["meja", branchId],
    queryFn: () => ambilMeja(branchId),
  });

  const cabangAktif = useMemo(() => cabang.filter((c) => c.is_active), [cabang]);
  const namaCabang = useMemo(() => new Map(cabang.map((c) => [c.id, c.name])), [cabang]);

  const perArea = useMemo(() => {
    const m = new Map<string, RestoTable[]>();
    for (const t of meja) {
      const key = t.area?.trim() || "Tanpa area";
      m.set(key, [...(m.get(key) ?? []), t]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "id"));
  }, [meja]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["meja"] });

  const simpan = useMutation({
    mutationFn: () => simpanMeja(form),
    onSuccess: () => {
      invalidate();
      toast.success("Meja tersimpan");
      setTerbuka(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => hapusMeja(id),
    onSuccess: () => {
      invalidate();
      toast.success("Meja dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bukaBaru = () => {
    setForm({ branch_id: branchId ?? cabangAktif[0]?.id, name: "", capacity: 4, area: "" });
    setTerbuka(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen meja"
        description={
          branchId
            ? `Meja di ${namaCabang.get(branchId) ?? "cabang terpilih"}, dikelompokkan per area.`
            : "Meja seluruh cabang, dikelompokkan per area. Gunakan pemilih cabang di atas untuk menyaring."
        }
        actions={
          <Button onClick={bukaBaru}>
            <Plus className="size-4" />
            Tambah meja
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : meja.length === 0 ? (
        <EmptyState>Belum ada meja untuk cabang ini.</EmptyState>
      ) : (
        <div className="space-y-6">
          {perArea.map(([area, daftar]) => (
            <Card key={area}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {area}
                  <Badge variant="outline" className="text-xs">
                    {daftar.length} meja
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  {daftar.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{t.name}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" />
                          {t.capacity}
                        </span>
                      </div>
                      {!branchId ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {namaCabang.get(t.branch_id) ?? "-"}
                        </p>
                      ) : null}
                      <div className="mt-2 flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 flex-1 text-xs"
                          onClick={() => {
                            setForm(t);
                            setTerbuka(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive"
                          disabled={hapus.isPending}
                          onClick={() => hapus.mutate(t.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit meja" : "Tambah meja"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="nama-meja">Nama meja</Label>
                <Input
                  id="nama-meja"
                  value={form.name ?? ""}
                  placeholder="A1"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kapasitas">Kapasitas</Label>
                <Input
                  id="kapasitas"
                  type="number"
                  min={1}
                  value={form.capacity ?? 4}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={form.area ?? ""}
                placeholder="Indoor / Outdoor / Lantai 2"
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
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
                if (!form.name?.trim() || !form.branch_id) {
                  toast.error("Cabang dan nama meja wajib diisi");
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
