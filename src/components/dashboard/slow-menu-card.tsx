import { useQuery } from "@tanstack/react-query";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/format";
import { ambilMenuLambat } from "@/services/report-service";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

export function SlowMenuCard({ from, to, branchId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["menu-lambat", from, to, branchId],
    queryFn: () => ambilMenuLambat(from, to, branchId, 10),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu paling tidak laku</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <EmptyState>Belum ada data menu pada periode ini.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Porsi terjual</TableHead>
                <TableHead className="text-right">Omzet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">
                    <span className="flex flex-wrap items-center gap-2">
                      {m.name}
                      {Number(m.qty) === 0 ? <Badge variant="destructive">Belum pernah terjual</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(m.base_price)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(m.qty)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(m.gross)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="text-xs text-muted-foreground">Kandidat untuk dievaluasi atau dihapus dari daftar menu.</p>
      </CardContent>
    </Card>
  );
}