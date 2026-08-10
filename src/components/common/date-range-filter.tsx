import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shiftIsoDate, todayWib } from "@/lib/format";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const preset = [
  { label: "Hari ini", days: 0 },
  { label: "7 hari", days: 6 },
  { label: "30 hari", days: 29 },
  { label: "60 hari", days: 59 },
];

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const terapkanPreset = (days: number) => {
    const hariIni = todayWib();
    onChange(shiftIsoDate(hariIni, -days), hariIni);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1">
        <Label htmlFor="dari" className="text-xs text-muted-foreground">
          Dari tanggal
        </Label>
        <Input
          id="dari"
          type="date"
          value={from}
          max={to}
          className="w-[160px] bg-card"
          onChange={(e) => onChange(e.target.value, to)}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="sampai" className="text-xs text-muted-foreground">
          Sampai tanggal
        </Label>
        <Input
          id="sampai"
          type="date"
          value={to}
          min={from}
          className="w-[160px] bg-card"
          onChange={(e) => onChange(from, e.target.value)}
        />
      </div>
      <div className="flex gap-1">
        {preset.map((p) => (
          <Button key={p.label} type="button" variant="outline" size="sm" onClick={() => terapkanPreset(p.days)}>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}