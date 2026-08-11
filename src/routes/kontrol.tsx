import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ban, Download, ScrollText, TicketPercent } from "lucide-react";

import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ControlCard } from "@/components/dashboard/control-card";
import { Button } from "@/components/ui/button";
import { unduhCsv } from "@/lib/csv";
import { formatRupiah, formatWaktu, shiftIsoDate, todayWib } from "@/lib/format";
import { ambilCabang } from "@/services/master-service";
import { ambilDiskonManual, ambilShift, ambilTransaksiDibatalkan } from "@/services/report-service";
import { useBranchStore } from "@/store/branch-store";

export const Route = createFileRoute("/kontrol")({
  head: () => ({
    meta: [
      { title: "Kontrol & Audit — Admin Empal Gentong" },
      {
        name: "description",
        content: "Transaksi dibatalkan, diskon manual, dan selisih kas per shift.",
      },
    ],
  }),
  component: HalamanKontrol,
});

function HalamanKontrol() {
  const hariIni = todayWib();
  const [from, setFrom] = useState(shiftIsoDate(hariIni, -29));
  const [to, setTo] = useState(hariIni);
  const { branchId } = useBranchStore();

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
  const { data: cabang = [] } = useQuery({ queryKey: ["cabang"], queryFn: ambilCabang });

  const namaCabang = useMemo(() => new Map(cabang.map((c) => [c.id, c.name])), [cabang]);

  const nilaiVoid = useMemo(
    () => (dibatalkan.data ?? []).reduce((a, o) => a + Number(o.grand_total), 0),
    [dibatalkan.data],
  );
  const nilaiDiskon = useMemo(
    () => (diskon.data ?? []).reduce((a, o) => a + Number(o.discount_total), 0),
    [diskon.data],
  );
  const shiftBermasalah = useMemo(
    () => (shift.data ?? []).filter((s) => s.closed_at === null || Number(s.variance ?? 0) !== 0),
    [shift.data],
  );

  const eksporSemua = () => {
    const rentang = `${from}-sd-${to}`;
    unduhCsv(
      `kontrol-transaksi-dibatalkan-${rentang}`,
      ["No. struk", "Cabang", "Dibuat", "Dibatalkan", "Nilai", "Alasan"],
      (dibatalkan.data ?? []).map((o) => [
        o.order_no,
        namaCabang.get(o.branch_id) ?? "-",
        formatWaktu(o.created_at),
        o.voided_at ? formatWaktu(o.voided_at) : "",
        o.grand_total,
        o.void_reason ?? "",
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontrol & audit"
        description="Tiga hal yang paling sering jadi sumber kebocoran di rumah makan: pembatalan, diskon manual, dan selisih kas."
        actions={
          <Button
            variant="outline"
            disabled={(dibatalkan.data ?? []).length === 0}
            onClick={eksporSemua}
          >
            <Download className="size-4" />
            Ekspor pembatalan
          </Button>
        }
      />

      <DateRangeFilter
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Transaksi dibatalkan"
          value={`${(dibatalkan.data ?? []).length} struk`}
          sublabel={`Nilai ${formatRupiah(nilaiVoid)}`}
          icon={Ban}
        />
        <StatCard
          label="Diskon manual"
          value={`${(diskon.data ?? []).length} struk`}
          sublabel={`Total ${formatRupiah(nilaiDiskon)}`}
          icon={TicketPercent}
        />
        <StatCard
          label="Shift perlu ditinjau"
          value={`${shiftBermasalah.length} shift`}
          sublabel="Belum ditutup atau ada selisih kas"
          icon={ScrollText}
        />
      </div>

      <ControlCard from={from} to={to} branchId={branchId} />
    </div>
  );
}
