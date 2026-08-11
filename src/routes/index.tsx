import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ban, Banknote, Landmark, Receipt, ShoppingBag, Store, TicketPercent, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { CashierPerformanceCard } from "@/components/dashboard/cashier-performance-card";
import { ChannelPriceCard } from "@/components/dashboard/channel-price-card";
import { ControlCard } from "@/components/dashboard/control-card";
import { HourlySalesCard } from "@/components/dashboard/hourly-sales-card";
import { OjolCommissionCard } from "@/components/dashboard/ojol-commission-card";
import { OrderTypeCard } from "@/components/dashboard/order-type-card";
import { PaymentMethodCard } from "@/components/dashboard/payment-method-card";
import { SlowMenuCard } from "@/components/dashboard/slow-menu-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah, formatRupiahShort, formatTanggal, shiftIsoDate, todayWib } from "@/lib/format";
import {
  ambilHarian,
  ambilPerCabang,
  ambilPerMenu,
  ambilRingkasan,
  ambilTransaksiDibatalkan,
} from "@/services/report-service";
import { useBranchStore } from "@/store/branch-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Omzet — Admin Empal Gentong" },
      {
        name: "description",
        content:
          "Pantau omzet harian, jumlah struk, perbandingan antar cabang, dan menu terlaris rumah makan Empal Gentong.",
      },
      { property: "og:title", content: "Dashboard Omzet — Admin Empal Gentong" },
      {
        property: "og:description",
        content: "Ringkasan omzet, tren 30 hari, perbandingan cabang, dan menu terlaris dalam satu layar.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const hariIni = todayWib();
  const [from, setFrom] = useState(shiftIsoDate(hariIni, -29));
  const [to, setTo] = useState(hariIni);
  const { branchId } = useBranchStore();

  const { data: ringkasan } = useQuery({
    queryKey: ["ringkasan", from, to, branchId],
    queryFn: () => ambilRingkasan(from, to, branchId),
  });
  const { data: ringkasanHariIni } = useQuery({
    queryKey: ["ringkasan", hariIni, hariIni, branchId],
    queryFn: () => ambilRingkasan(hariIni, hariIni, branchId),
  });
  const kemarin = shiftIsoDate(hariIni, -1);
  const { data: ringkasanKemarin } = useQuery({
    queryKey: ["ringkasan", kemarin, kemarin, branchId],
    queryFn: () => ambilRingkasan(kemarin, kemarin, branchId),
  });
  const { data: harian = [] } = useQuery({
    queryKey: ["harian", from, to, branchId],
    queryFn: () => ambilHarian(from, to, branchId),
  });
  const { data: perCabang = [] } = useQuery({
    queryKey: ["per-cabang", from, to],
    queryFn: () => ambilPerCabang(from, to),
  });
  const { data: perMenu = [] } = useQuery({
    queryKey: ["per-menu", from, to, branchId],
    queryFn: () => ambilPerMenu(from, to, branchId),
  });
  const { data: transaksiDibatalkan = [] } = useQuery({
    queryKey: ["transaksi-dibatalkan", from, to, branchId],
    queryFn: () => ambilTransaksiDibatalkan(from, to, branchId),
  });

  const deltaOmzet = useMemo(() => {
    const now = Number(ringkasanHariIni?.gross ?? 0);
    const prev = Number(ringkasanKemarin?.gross ?? 0);
    if (prev === 0) return null;
    return ((now - prev) / prev) * 100;
  }, [ringkasanHariIni, ringkasanKemarin]);

  const dataGrafik = harian.map((d) => ({ ...d, label: formatTanggal(d.day + "T00:00:00+07:00") }));
  const menuTerlaris = perMenu.slice(0, 10);
  const omzetBersih =
    Number(ringkasan?.gross ?? 0) - Number(ringkasan?.tax ?? 0) - Number(ringkasan?.service ?? 0);
  const nilaiDibatalkan = transaksiDibatalkan.reduce((acc, o) => acc + Number(o.grand_total), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard pemilik"
        description="Ringkasan performa penjualan seluruh cabang dalam rentang tanggal terpilih."
      />
      <DateRangeFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Omzet hari ini"
          value={formatRupiah(ringkasanHariIni?.gross)}
          delta={deltaOmzet}
          sublabel="vs kemarin"
          icon={Banknote}
        />
        <StatCard
          label="Jumlah struk hari ini"
          value={formatNumber(ringkasanHariIni?.order_count)}
          sublabel={`Kemarin ${formatNumber(ringkasanKemarin?.order_count)} struk`}
          icon={Receipt}
        />
        <StatCard
          label="Rata-rata per struk"
          value={formatRupiah(ringkasanHariIni?.avg_ticket)}
          sublabel="Hari ini"
          icon={ShoppingBag}
        />
        <StatCard
          label="Omzet rentang terpilih"
          value={formatRupiah(ringkasan?.gross)}
          sublabel={`${formatNumber(ringkasan?.order_count)} struk · PB1 ${formatRupiah(ringkasan?.tax)}`}
          icon={Store}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Omzet bersih"
          value={formatRupiah(omzetBersih)}
          sublabel="Omzet dikurangi PB1 & service"
          icon={Wallet}
        />
        <StatCard
          label="Total diskon diberikan"
          value={formatRupiah(ringkasan?.discount)}
          sublabel="Rentang terpilih"
          icon={TicketPercent}
        />
        <StatCard
          label="Total PB1 terkumpul"
          value={formatRupiah(ringkasan?.tax)}
          sublabel="Untuk setoran pajak daerah"
          icon={Landmark}
        />
        <Card
          className={
            transaksiDibatalkan.length > 0 ? "border-destructive/50 bg-destructive/5" : "border-border/70"
          }
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Transaksi dibatalkan</p>
              <Ban
                className={
                  transaksiDibatalkan.length > 0 ? "size-4 text-destructive" : "size-4 text-muted-foreground"
                }
              />
            </div>
            <p
              className={
                transaksiDibatalkan.length > 0
                  ? "mt-2 text-2xl font-semibold tabular-nums text-destructive"
                  : "mt-2 text-2xl font-semibold tabular-nums text-foreground"
              }
            >
              {formatNumber(transaksiDibatalkan.length)} struk
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Nilai {formatRupiah(nilaiDibatalkan)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tren omzet harian</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataGrafik} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v: number) => formatRupiahShort(v)} tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(v: number) => formatRupiah(v)}
                labelFormatter={(l: string) => `Tanggal ${l}`}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="gross" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Omzet" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan antar cabang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perCabang} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="branch_code" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => formatRupiahShort(v)} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(v: number) => formatRupiah(v)}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="gross" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Omzet" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cabang</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">Struk</TableHead>
                  <TableHead className="text-right">Rata-rata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perCabang.map((c) => (
                  <TableRow key={c.branch_id}>
                    <TableCell className="font-medium">{c.branch_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(c.gross)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(c.order_count)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(c.avg_ticket)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menu terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Porsi</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuTerlaris.map((m) => (
                  <TableRow key={m.name}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(m.qty)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(m.gross)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}