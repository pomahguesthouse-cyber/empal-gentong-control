import { useQuery } from "@tanstack/react-query";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDecimal, formatRupiah, formatWaktu } from "@/lib/format";
import { ambilDiskonManual, ambilShift, ambilTransaksiDibatalkan } from "@/services/report-service";
import { cn } from "@/lib/utils";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

export function ControlCard({ from, to, branchId }: Props) {
  const dibatalkan = useQuery({
    queryKey: ["transaksi-dibatalkan", from, to, branchId],
    queryFn: () => ambilTransaksiDibatalkan(from, to, branchId),
  });
  const diskon = useQuery({
    queryKey: ["diskon-manual", from, to, branchId],
    queryFn: () => ambilDiskonManual(from, to, branchId),
  });
  const shift = useQuery({
    queryKey: ["shift", from, to, branchId],
    queryFn: () => ambilShift(from, to, branchId),
  });

  // Shift yang belum ditutup ditaruh paling atas
  const daftarShift = [...(shift.data ?? [])].sort((a, b) => {
    const aBelum = a.closed_at === null ? 0 : 1;
    const bBelum = b.closed_at === null ? 0 : 1;
    if (aBelum !== bBelum) return aBelum - bBelum;
    return a.opened_at < b.opened_at ? 1 : -1;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrol &amp; pengawasan</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="void">
          <TabsList className="flex-wrap">
            <TabsTrigger value="void">Transaksi dibatalkan</TabsTrigger>
            <TabsTrigger value="diskon">Diskon manual</TabsTrigger>
            <TabsTrigger value="kas">Selisih kas</TabsTrigger>
          </TabsList>

          <TabsContent value="void" className="mt-4">
            {dibatalkan.isLoading ? (
              <TableSkeleton />
            ) : (dibatalkan.data ?? []).length === 0 ? (
              <EmptyState>Tidak ada transaksi dibatalkan pada periode ini.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. struk</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                    <TableHead>Alasan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dibatalkan.data ?? []).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.order_no}</TableCell>
                      <TableCell>{formatWaktu(o.voided_at ?? o.created_at)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(o.grand_total)}</TableCell>
                      <TableCell className="text-muted-foreground">{o.void_reason ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="diskon" className="mt-4">
            {diskon.isLoading ? (
              <TableSkeleton />
            ) : (diskon.data ?? []).length === 0 ? (
              <EmptyState>Tidak ada diskon manual pada periode ini.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. struk</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Diskon</TableHead>
                    <TableHead className="text-right">% diskon</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(diskon.data ?? []).map((o) => {
                    const persen = Number(o.subtotal) > 0 ? (Number(o.discount_total) / Number(o.subtotal)) * 100 : 0;
                    const berlebih = persen > 20;
                    return (
                      <TableRow key={o.id} className={cn(berlebih && "bg-destructive/5")}>
                        <TableCell className="font-medium">{o.order_no}</TableCell>
                        <TableCell>{formatWaktu(o.created_at)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(o.subtotal)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(o.discount_total)}</TableCell>
                        <TableCell
                          className={cn("text-right tabular-nums", berlebih && "font-semibold text-destructive")}
                        >
                          {formatDecimal(persen)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(o.grand_total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="kas" className="mt-4">
            {shift.isLoading ? (
              <TableSkeleton />
            ) : daftarShift.length === 0 ? (
              <EmptyState>Tidak ada data shift pada periode ini.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dibuka</TableHead>
                    <TableHead>Ditutup</TableHead>
                    <TableHead className="text-right">Kas awal</TableHead>
                    <TableHead className="text-right">Kas seharusnya</TableHead>
                    <TableHead className="text-right">Kas terhitung</TableHead>
                    <TableHead className="text-right">Selisih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daftarShift.map((s) => {
                    const selisih = Number(s.variance ?? 0);
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{formatWaktu(s.opened_at)}</TableCell>
                        <TableCell>
                          {s.closed_at ? formatWaktu(s.closed_at) : <Badge variant="outline">Belum ditutup</Badge>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(s.opening_cash)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.closing_cash_expected === null ? "-" : formatRupiah(s.closing_cash_expected)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.closing_cash_counted === null ? "-" : formatRupiah(s.closing_cash_counted)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            s.variance === null
                              ? "text-muted-foreground"
                              : selisih < 0
                                ? "text-destructive"
                                : selisih > 0
                                  ? "text-warning"
                                  : "text-success",
                          )}
                        >
                          {s.variance === null ? "-" : formatRupiah(selisih)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}