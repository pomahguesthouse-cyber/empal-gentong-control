import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartSkeleton, EmptyState } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDecimal, formatNumber, formatRupiah, LABEL_METODE } from "@/lib/format";
import { ambilPerMetode } from "@/services/report-service";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

const METODE_OJOL = ["gofood", "grabfood", "shopeefood"];

// Kelompok ojol memakai warna berbeda dari metode kasir
const warnaMetode = (method: string, index: number): string =>
  METODE_OJOL.includes(method) ? `var(--chart-${(index % 2) + 4})` : `var(--chart-${(index % 3) + 1})`;

export function PaymentMethodCard({ from, to, branchId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["per-metode", from, to, branchId],
    queryFn: () => ambilPerMetode(from, to, branchId),
  });

  const totalOmzet = data.reduce((acc, d) => acc + Number(d.total), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metode pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <ChartSkeleton className="h-[220px]" />
        ) : data.length === 0 ? (
          <EmptyState>Belum ada pembayaran tercatat pada periode ini.</EmptyState>
        ) : (
          <>
            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.map((d) => ({ ...d, label: LABEL_METODE[d.method] ?? d.method }))}
                    dataKey="total"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.map((d, i) => (
                      <Cell key={d.method} fill={warnaMetode(d.method, i)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">% omzet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d, i) => (
                  <TableRow key={d.method}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: warnaMetode(d.method, i) }}
                          aria-hidden
                        />
                        {LABEL_METODE[d.method] ?? d.method}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(d.total)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(d.trx)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(totalOmzet > 0 ? (Number(d.total) / totalOmzet) * 100 : 0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}