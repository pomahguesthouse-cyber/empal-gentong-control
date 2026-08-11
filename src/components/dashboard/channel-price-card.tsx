import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, TableSkeleton } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDecimal, formatRupiah } from "@/lib/format";
import { ambilMarginChannel } from "@/services/report-service";

function TabelChannel({ channel, cari }: { channel: string; cari: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["margin-channel", channel],
    queryFn: () => ambilMarginChannel(channel),
  });

  const kunci = cari.trim().toLowerCase();
  const baris = kunci === "" ? data : data.filter((d) => d.name.toLowerCase().includes(kunci));

  if (isLoading) return <TableSkeleton />;
  if (data.length === 0) return <EmptyState>Belum ada harga channel untuk kanal ini.</EmptyState>;
  if (baris.length === 0) return <EmptyState>Tidak ada menu yang cocok dengan pencarian.</EmptyState>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Menu</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="text-right">Harga dine-in</TableHead>
          <TableHead className="text-right">Harga channel</TableHead>
          <TableHead className="text-right">Markup %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {baris.map((m) => (
          <TableRow key={m.name}>
            <TableCell className="font-medium">{m.name}</TableCell>
            <TableCell className="text-muted-foreground">{m.category}</TableCell>
            <TableCell className="text-right tabular-nums">{formatRupiah(m.base_price)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatRupiah(m.channel_price)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatDecimal(Number(m.markup_pct ?? 0))}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ChannelPriceCard() {
  const [cari, setCari] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Harga channel ojol</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gofood">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="gofood">GoFood</TabsTrigger>
              <TabsTrigger value="grabfood">GrabFood</TabsTrigger>
            </TabsList>
            <Input
              value={cari}
              placeholder="Cari nama menu"
              className="h-9 w-full bg-card sm:w-64"
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
          <TabsContent value="gofood" className="mt-4">
            <TabelChannel channel="gofood" cari={cari} />
          </TabsContent>
          <TabsContent value="grabfood" className="mt-4">
            <TabelChannel channel="grabfood" cari={cari} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}