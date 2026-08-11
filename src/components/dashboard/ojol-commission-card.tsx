import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/format";
import { ambilPerMetode } from "@/services/report-service";

interface Props {
  from: string;
  to: string;
  branchId: string | null;
}

const METODE_OJOL = ["gofood", "grabfood", "shopeefood"];

export function OjolCommissionCard({ from, to, branchId }: Props) {
  const [persenKomisi, setPersenKomisi] = useState(20);
  const { data = [], isLoading } = useQuery({
    queryKey: ["per-metode", from, to, branchId],
    queryFn: () => ambilPerMetode(from, to, branchId),
  });

  const omzetKotor = data
    .filter((d) => METODE_OJOL.includes(d.method))
    .reduce((acc, d) => acc + Number(d.total), 0);
  const komisi = Math.round((omzetKotor * persenKomisi) / 100);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Estimasi komisi ojol</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="persen-komisi" className="text-xs text-muted-foreground">
            Komisi %
          </Label>
          <Input
            id="persen-komisi"
            type="number"
            min={0}
            max={100}
            value={persenKomisi}
            className="h-8 w-20 bg-card"
            onChange={(e) => setPersenKomisi(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : omzetKotor === 0 ? (
          <EmptyState>Belum ada transaksi ojol pada periode ini.</EmptyState>
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Omzet kotor ojol</dt>
              <dd className="font-medium tabular-nums">{formatRupiah(omzetKotor)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Estimasi komisi ({persenKomisi}%)</dt>
              <dd className="font-medium tabular-nums text-destructive">-{formatRupiah(komisi)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-2">
              <dt className="font-medium">Omzet bersih ojol</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatRupiah(omzetKotor - komisi)}</dd>
            </div>
          </dl>
        )}
        <p className="text-xs text-muted-foreground">
          Asumsi komisi {persenKomisi}%. Harga jual di GoFood/GrabFood sudah dinaikkan untuk menutup komisi ini.
        </p>
      </CardContent>
    </Card>
  );
}