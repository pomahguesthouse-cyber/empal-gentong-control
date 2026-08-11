import { useQuery } from "@tanstack/react-query";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/format";
import { ambilPerKasir } from "@/services/report-service";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

export function CashierPerformanceCard({ from, to, branchId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["per-kasir", from, to, branchId],
    queryFn: () => ambilPerKasir(from, to, branchId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kinerja kasir</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyState>Belum ada transaksi kasir pada periode ini.</EmptyState>
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
              {data.map((k) => (
                <TableRow key={k.cashier}>
                  <TableCell className="font-medium">{k.cashier}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(k.gross)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(k.order_count)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(k.avg_ticket)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}