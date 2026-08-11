import { useQuery } from "@tanstack/react-query";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDecimal, formatNumber, formatRupiah } from "@/lib/format";
import { ambilPerTipePesanan } from "@/services/report-service";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

const LABEL_TIPE: Record<string, string> = {
  dine_in: "Makan di Tempat",
  takeaway: "Bawa Pulang",
  delivery: "Pesan Antar",
};

const URUTAN_TIPE = ["dine_in", "takeaway", "delivery"];

export function OrderTypeCard({ from, to, branchId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["per-tipe-pesanan", from, to, branchId],
    queryFn: () => ambilPerTipePesanan(from, to, branchId),
  });

  const totalOmzet = data.reduce((acc, d) => acc + Number(d.gross), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipe pesanan</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : totalOmzet === 0 ? (
          <EmptyState>Belum ada pesanan pada periode ini.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {URUTAN_TIPE.map((tipe) => {
              const baris = data.find((d) => d.order_type === tipe);
              const gross = Number(baris?.gross ?? 0);
              const kontribusi = totalOmzet > 0 ? (gross / totalOmzet) * 100 : 0;
              return (
                <div key={tipe} className="rounded-lg border border-border/70 p-4">
                  <p className="text-sm font-medium text-muted-foreground">{LABEL_TIPE[tipe]}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{formatRupiah(gross)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(baris?.order_count)} struk · rata-rata {formatRupiah(baris?.avg_ticket)}
                  </p>
                  <Progress value={kontribusi} className="mt-3" />
                  <p className="mt-1 text-xs text-muted-foreground">{formatDecimal(kontribusi)}% dari omzet</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}