import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartSkeleton, EmptyState, labelJam } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatRupiah, formatRupiahShort } from "@/lib/format";
import { ambilPerJam } from "@/services/report-service";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

export function HourlySalesCard({ from, to, branchId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["per-jam", from, to, branchId],
    queryFn: () => ambilPerJam(from, to, branchId),
  });

  // Lengkapi 0-23 jam agar sumbu X selalu penuh
  const perJam = Array.from({ length: 24 }, (_, hour) => {
    const baris = data.find((d) => Number(d.hour) === hour);
    return {
      hour,
      label: labelJam(hour),
      gross: Number(baris?.gross ?? 0),
      order_count: Number(baris?.order_count ?? 0),
    };
  });

  const terisi = perJam.filter((j) => j.order_count > 0);
  const tersibuk = terisi.reduce<(typeof perJam)[number] | null>(
    (acc, j) => (acc === null || j.gross > acc.gross ? j : acc),
    null,
  );
  const tersepi = terisi.reduce<(typeof perJam)[number] | null>(
    (acc, j) => (acc === null || j.gross < acc.gross ? j : acc),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penjualan per jam</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <ChartSkeleton className="h-[260px]" />
        ) : terisi.length === 0 ? (
          <EmptyState>Belum ada penjualan pada periode ini.</EmptyState>
        ) : (
          <>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perJam} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis tickFormatter={(v: number) => formatRupiahShort(v)} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "Omzet" ? formatRupiah(value) : `${formatNumber(value)} struk`
                    }
                    labelFormatter={(l: string) => `Jam ${l}`}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="gross" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Omzet" />
                  <Bar dataKey="order_count" fill="transparent" name="Struk" legendType="none" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground">
              {tersibuk ? (
                <>
                  Jam tersibuk {tersibuk.label} ({formatRupiahShort(tersibuk.gross)} ·{" "}
                  {formatNumber(tersibuk.order_count)} struk)
                </>
              ) : null}
              {tersepi ? (
                <>
                  {" · "}jam tersepi {tersepi.label} ({formatRupiahShort(tersepi.gross)} ·{" "}
                  {formatNumber(tersepi.order_count)} struk)
                </>
              ) : null}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}