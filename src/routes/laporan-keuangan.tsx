import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Landmark, TrendingUp, Wallet } from "lucide-react";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unduhCsv } from "@/lib/csv";
import { formatRupiah, formatWaktu, shiftIsoDate, todayWib } from "@/lib/format";
import { ambilCabang } from "@/services/master-service";
import {
  ambilBiayaPerKategori,
  ambilLabaRugi,
  ambilPb1,
  ambilShift,
} from "@/services/report-service";
import { useBranchStore } from "@/store/branch-store";

export const Route = createFileRoute("/laporan-keuangan")({
  head: () => ({
    meta: [
      { title: "Laporan Keuangan — Admin Empal Gentong" },
      {
        name: "description",
        content: "Laba rugi sederhana, rekap PB1 per cabang untuk setoran Bapenda, dan arus kas per shift.",
      },
    ],
  }),
  component: HalamanLaporanKeuangan,
});

function HalamanLaporanKeuangan() {
  const hariIni = todayWib();
  const [from, setFrom] = useState(shiftIsoDate(hariIni, -29));
  const [to, setTo] = useState(hariIni);
  const [bulan, setBulan] = useState(hariIni.slice(0, 7));
  const { branchId } = useBranchStore();

  const labaRugi = useQuery({
    queryKey: ["laba-rugi", from, to, branchId],
    queryFn: () => ambilLabaRugi(from, to, branchId),
  });
  const biayaKategori = useQuery({
    queryKey: ["biaya-kategori", from, to, branchId],
    queryFn: () => ambilBiayaPerKategori(from, to, branchId),
  });
  const pb1 = useQuery({
    queryKey: ["pb1", bulan],
    queryFn: () => ambilPb1(`${bulan}-01`),
  });
  const shift = useQuery({
    queryKey: ["shift", from, to, branchId],
    queryFn: () => ambilShift(from, to, branchId),
  });
  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });

  const namaCabang = useMemo(() => new Map(cabang.map((c) => [c.id, c.name])), [cabang]);
  const lr = labaRugi.data;
  const totalBiaya = useMemo(
    () => (biayaKategori.data ?? []).reduce((a, b) => a + Number(b.total), 0),
    [biayaKategori.data],
  );
  const totalPb1 = useMemo(
    () => (pb1.data ?? []).reduce((a, b) => a + Number(b.pb1), 0),
    [pb1.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan keuangan"
        description="Laba rugi sederhana, setoran pajak daerah, dan arus kas per shift."
      />
      <DateRangeFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <Tabs defaultValue="laba-rugi">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="laba-rugi">Laba rugi</TabsTrigger>
          <TabsTrigger value="pb1">Rekap PB1</TabsTrigger>
          <TabsTrigger value="kas">Arus kas per shift</TabsTrigger>
        </TabsList>

        <TabsContent value="laba-rugi" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Omzet kotor" value={formatRupiah(lr?.gross)} sublabel="Termasuk PB1 & service" icon={TrendingUp} />
            <StatCard label="Omzet bersih" value={formatRupiah(lr?.net_sales)} sublabel="Setelah PB1 & service" icon={Wallet} />
            <StatCard label="Biaya operasional" value={formatRupiah(lr?.expense_total)} sublabel="Rentang terpilih" icon={Landmark} />
            <StatCard
              label="Laba"
              value={formatRupiah(lr?.profit)}
              sublabel="Omzet bersih − biaya"
              delta={lr && Number(lr.net_sales) > 0 ? (Number(lr.profit) / Number(lr.net_sales)) * 100 : null}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rincian laba rugi</CardTitle>
              </CardHeader>
              <CardContent>
                {labaRugi.isLoading ? (
                  <TableSkeleton rows={6} />
                ) : (
                  <dl className="space-y-2 text-sm">
                    <Baris label="Omzet kotor" value={formatRupiah(lr?.gross)} />
                    <Baris label="Diskon diberikan" value={"-" + formatRupiah(lr?.discount)} muted />
                    <Baris label="PB1 (pajak daerah)" value={"-" + formatRupiah(lr?.tax)} muted />
                    <Baris label="Service charge" value={"-" + formatRupiah(lr?.service)} muted />
                    <Baris label="Omzet bersih" value={formatRupiah(lr?.net_sales)} tebal />
                    <Baris label="Biaya operasional" value={"-" + formatRupiah(lr?.expense_total)} muted />
                    <Baris label="Laba" value={formatRupiah(lr?.profit)} tebal besar />
                  </dl>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Belum termasuk HPP bahan baku. Angka ini menjadi akurat setelah modul stok &amp; resep aktif.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Biaya per kategori</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(biayaKategori.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `biaya-per-kategori-${from}-sd-${to}`,
                      ["Kategori", "Total"],
                      (biayaKategori.data ?? []).map((b) => [b.category, b.total]),
                    )
                  }
                >
                  <Download className="size-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                {biayaKategori.isLoading ? (
                  <TableSkeleton />
                ) : (biayaKategori.data ?? []).length === 0 ? (
                  <EmptyState>Belum ada biaya tercatat pada rentang ini.</EmptyState>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Porsi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(biayaKategori.data ?? []).map((b) => (
                        <TableRow key={b.category}>
                          <TableCell className="font-medium">{b.category}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatRupiah(b.total)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {totalBiaya > 0 ? ((Number(b.total) / totalBiaya) * 100).toFixed(1) + "%" : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pb1" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
                <div className="grid gap-1">
                  <Label htmlFor="bulan" className="text-xs text-muted-foreground">
                    Masa pajak
                  </Label>
                  <Input
                    id="bulan"
                    type="month"
                    value={bulan}
                    className="w-full bg-card sm:w-[180px]"
                    onChange={(e) => setBulan(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(pb1.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `rekap-pb1-${bulan}`,
                      ["Kode", "Cabang", "Tarif %", "Omzet bersih", "PB1 terutang", "Struk"],
                      (pb1.data ?? []).map((p) => [
                        p.branch_code,
                        p.branch_name,
                        p.tax_rate,
                        p.net_sales,
                        p.pb1,
                        p.order_count,
                      ]),
                    )
                  }
                >
                  <Download className="size-4" />
                  Ekspor CSV
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                PB1 disetor ke Bapenda masing-masing kabupaten/kota, jadi angkanya sengaja dipisah per
                cabang. Jangan digabung saat menyetor.
              </p>

              {pb1.isLoading ? (
                <TableSkeleton />
              ) : (pb1.data ?? []).length === 0 ? (
                <EmptyState>Tidak ada transaksi pada masa pajak ini.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cabang</TableHead>
                      <TableHead className="text-right">Tarif</TableHead>
                      <TableHead className="text-right">Omzet bersih</TableHead>
                      <TableHead className="text-right">PB1 terutang</TableHead>
                      <TableHead className="text-right">Struk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pb1.data ?? []).map((p) => (
                      <TableRow key={p.branch_code}>
                        <TableCell className="font-medium">
                          {p.branch_name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{p.branch_code}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.tax_rate}%</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(p.net_sales)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatRupiah(p.pb1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.order_count}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={3} className="font-medium">
                        Total seluruh cabang
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatRupiah(totalPb1)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kas" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Kas seharusnya dihitung sistem, kas terhitung diisi kasir saat tutup shift. Selisih yang
                berulang perlu ditelusuri.
              </p>
              {shift.isLoading ? (
                <TableSkeleton />
              ) : (shift.data ?? []).length === 0 ? (
                <EmptyState>Belum ada shift pada rentang ini.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Dibuka</TableHead>
                      <TableHead>Ditutup</TableHead>
                      <TableHead className="text-right">Kas awal</TableHead>
                      <TableHead className="text-right">Seharusnya</TableHead>
                      <TableHead className="text-right">Terhitung</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(shift.data ?? []).map((s) => {
                      const selisih = Number(s.variance ?? 0);
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{namaCabang.get(s.branch_id) ?? "-"}</TableCell>
                          <TableCell className="text-xs">{formatWaktu(s.opened_at)}</TableCell>
                          <TableCell className="text-xs">
                            {s.closed_at ? (
                              formatWaktu(s.closed_at)
                            ) : (
                              <Badge variant="secondary">Belum ditutup</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(s.opening_cash)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(s.closing_cash_expected)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(s.closing_cash_counted)}
                          </TableCell>
                          <TableCell
                            className={
                              selisih < 0
                                ? "text-right tabular-nums font-medium text-destructive"
                                : selisih > 0
                                  ? "text-right tabular-nums font-medium text-warning"
                                  : "text-right tabular-nums text-muted-foreground"
                            }
                          >
                            {selisih === 0 ? "—" : formatRupiah(selisih)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Baris({
  label,
  value,
  muted,
  tebal,
  besar,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tebal?: boolean;
  besar?: boolean;
}) {
  return (
    <div
      className={
        tebal
          ? "flex items-center justify-between border-t border-border/70 pt-2"
          : "flex items-center justify-between"
      }
    >
      <dt className={muted ? "text-muted-foreground" : tebal ? "font-medium" : ""}>{label}</dt>
      <dd
        className={
          besar
            ? "text-lg font-semibold tabular-nums"
            : tebal
              ? "font-semibold tabular-nums"
              : muted
                ? "tabular-nums text-muted-foreground"
                : "tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
