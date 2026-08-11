import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageHeader } from "@/components/common/page-header";
import { ChartSkeleton, EmptyState, TableSkeleton, labelJam } from "@/components/dashboard/dashboard-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unduhCsv } from "@/lib/csv";
import {
  LABEL_METODE,
  formatNumber,
  formatRupiah,
  formatRupiahShort,
  formatTanggal,
  shiftIsoDate,
  todayWib,
} from "@/lib/format";
import {
  ambilHarian,
  ambilPerCabang,
  ambilPerJam,
  ambilPerKasir,
  ambilPerMenu,
  ambilPerMetode,
} from "@/services/report-service";
import { useBranchStore } from "@/store/branch-store";

export const Route = createFileRoute("/laporan-penjualan")({
  head: () => ({
    meta: [
      { title: "Laporan Penjualan — Admin Empal Gentong" },
      {
        name: "description",
        content: "Ringkasan harian, per cabang, per menu, per jam, per metode bayar, dan per kasir.",
      },
    ],
  }),
  component: HalamanLaporanPenjualan,
});

function HalamanLaporanPenjualan() {
  const hariIni = todayWib();
  const [from, setFrom] = useState(shiftIsoDate(hariIni, -29));
  const [to, setTo] = useState(hariIni);
  const { branchId } = useBranchStore();

  const harian = useQuery({
    queryKey: ["lap-harian", from, to, branchId],
    queryFn: () => ambilHarian(from, to, branchId),
  });
  const perCabang = useQuery({
    queryKey: ["lap-cabang", from, to],
    queryFn: () => ambilPerCabang(from, to),
  });
  const perMenu = useQuery({
    queryKey: ["lap-menu", from, to, branchId],
    queryFn: () => ambilPerMenu(from, to, branchId),
  });
  const perJam = useQuery({
    queryKey: ["lap-jam", from, to, branchId],
    queryFn: () => ambilPerJam(from, to, branchId),
  });
  const perMetode = useQuery({
    queryKey: ["lap-metode", from, to, branchId],
    queryFn: () => ambilPerMetode(from, to, branchId),
  });
  const perKasir = useQuery({
    queryKey: ["lap-kasir", from, to, branchId],
    queryFn: () => ambilPerKasir(from, to, branchId),
  });

  const totalMetode = useMemo(
    () => (perMetode.data ?? []).reduce((a, b) => a + Number(b.total), 0),
    [perMetode.data],
  );

  const dataJam = useMemo(
    () => (perJam.data ?? []).map((j) => ({ ...j, label: labelJam(j.hour) })),
    [perJam.data],
  );

  const rentang = `${from}-sd-${to}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan penjualan"
        description="Semua angka mengikuti rentang tanggal dan cabang yang dipilih. Hanya transaksi lunas."
      />
      <DateRangeFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <Tabs defaultValue="harian">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="harian">Harian</TabsTrigger>
          <TabsTrigger value="cabang">Per cabang</TabsTrigger>
          <TabsTrigger value="menu">Per menu</TabsTrigger>
          <TabsTrigger value="jam">Per jam</TabsTrigger>
          <TabsTrigger value="metode">Metode bayar</TabsTrigger>
          <TabsTrigger value="kasir">Per kasir</TabsTrigger>
        </TabsList>

        <TabsContent value="harian" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(harian.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `penjualan-harian-${rentang}`,
                      ["Tanggal", "Omzet", "Struk", "Rata-rata"],
                      (harian.data ?? []).map((d) => [d.day, d.gross, d.order_count, d.avg_ticket]),
                    )
                  }
                >
                  <Download className="size-4" />
                  Ekspor CSV
                </Button>
              </div>
              {harian.isLoading ? (
                <TableSkeleton rows={8} />
              ) : (harian.data ?? []).length === 0 ? (
                <EmptyState>Tidak ada penjualan pada rentang ini.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Omzet</TableHead>
                      <TableHead className="text-right">Struk</TableHead>
                      <TableHead className="text-right">Rata-rata per struk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(harian.data ?? [])
                      .slice()
                      .reverse()
                      .map((d) => (
                        <TableRow key={d.day}>
                          <TableCell className="tabular-nums">{formatTanggal(d.day + "T00:00:00+07:00")}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatRupiah(d.gross)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(d.order_count)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatRupiah(d.avg_ticket)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cabang" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(perCabang.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `penjualan-per-cabang-${rentang}`,
                      ["Kode", "Cabang", "Omzet", "PB1", "Struk", "Rata-rata"],
                      (perCabang.data ?? []).map((c) => [
                        c.branch_code,
                        c.branch_name,
                        c.gross,
                        c.tax,
                        c.order_count,
                        c.avg_ticket,
                      ]),
                    )
                  }
                >
                  <Download className="size-4" />
                  Ekspor CSV
                </Button>
              </div>
              {perCabang.isLoading ? (
                <TableSkeleton />
              ) : (perCabang.data ?? []).length === 0 ? (
                <EmptyState>Tidak ada penjualan pada rentang ini.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cabang</TableHead>
                      <TableHead className="text-right">Omzet</TableHead>
                      <TableHead className="text-right">PB1</TableHead>
                      <TableHead className="text-right">Struk</TableHead>
                      <TableHead className="text-right">Rata-rata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(perCabang.data ?? []).map((c) => (
                      <TableRow key={c.branch_id}>
                        <TableCell className="font-medium">
                          {c.branch_name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{c.branch_code}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatRupiah(c.gross)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(c.tax)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(c.order_count)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(c.avg_ticket)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Nama menu diambil dari snapshot saat transaksi, bukan dari master menu terkini.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(perMenu.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `penjualan-per-menu-${rentang}`,
                      ["Menu", "Porsi", "Omzet"],
                      (perMenu.data ?? []).map((m) => [m.name, m.qty, m.gross]),
                    )
                  }
                >
                  <Download className="size-4" />
                  Ekspor CSV
                </Button>
              </div>
              {perMenu.isLoading ? (
                <TableSkeleton rows={10} />
              ) : (perMenu.data ?? []).length === 0 ? (
                <EmptyState>Tidak ada penjualan menu pada rentang ini.</EmptyState>
              ) : (
                <div className="max-h-[60vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Menu</TableHead>
                        <TableHead className="text-right">Porsi</TableHead>
                        <TableHead className="text-right">Omzet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(perMenu.data ?? []).map((m) => (
                        <TableRow key={m.name}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(m.qty)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatRupiah(m.gross)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jam" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Pakai grafik ini untuk menentukan jadwal shift dan waktu persiapan dapur.
              </p>
              {perJam.isLoading ? (
                <ChartSkeleton className="h-[240px] sm:h-[320px]" />
              ) : dataJam.length === 0 ? (
                <EmptyState>Tidak ada penjualan pada rentang ini.</EmptyState>
              ) : (
                <div className="h-[240px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataJam} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v: number) => formatRupiahShort(v)}
                        tick={{ fontSize: 11 }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(v: number) => formatRupiah(v)}
                        labelFormatter={(l: string) => `Pukul ${l}`}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="gross" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Omzet" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metode" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(perMetode.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `penjualan-metode-bayar-${rentang}`,
                      ["Metode", "Total", "Transaksi"],
                      (perMetode.data ?? []).map((m) => [
                        LABEL_METODE[m.method] ?? m.method,
                        m.total,
                        m.trx,
                      ]),
                    )
                  }
                >
                  <Download className="size-4" />
                  Ekspor CSV
                </Button>
              </div>
              {perMetode.isLoading ? (
                <TableSkeleton />
              ) : (perMetode.data ?? []).length === 0 ? (
                <EmptyState>Tidak ada pembayaran pada rentang ini.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Transaksi</TableHead>
                      <TableHead className="text-right">Porsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(perMetode.data ?? []).map((m) => (
                      <TableRow key={m.method}>
                        <TableCell className="font-medium">{LABEL_METODE[m.method] ?? m.method}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatRupiah(m.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(m.trx)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {totalMetode > 0 ? ((Number(m.total) / totalMetode) * 100).toFixed(1) + "%" : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kasir" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(perKasir.data ?? []).length === 0}
                  onClick={() =>
                    unduhCsv(
                      `penjualan-per-kasir-${rentang}`,
                      ["Kasir", "Omzet", "Struk", "Rata-rata"],
                      (perKasir.data ?? []).map((k) => [k.cashier, k.gross, k.order_count, k.avg_ticket]),
                    )
                  }
                >
                  <Download className="size-4" />
                  Ekspor CSV
                </Button>
              </div>
              {perKasir.isLoading ? (
                <TableSkeleton />
              ) : (perKasir.data ?? []).length === 0 ? (
                <EmptyState>Tidak ada transaksi kasir pada rentang ini.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kasir</TableHead>
                      <TableHead className="text-right">Omzet</TableHead>
                      <TableHead className="text-right">Struk</TableHead>
                      <TableHead className="text-right">Rata-rata per struk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(perKasir.data ?? []).map((k) => (
                      <TableRow key={k.cashier}>
                        <TableCell className="font-medium">{k.cashier}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatRupiah(k.gross)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(k.order_count)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(k.avg_ticket)}</TableCell>
                      </TableRow>
                    ))}
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
