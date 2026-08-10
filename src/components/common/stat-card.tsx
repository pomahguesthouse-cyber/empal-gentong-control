import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  delta?: number | null;
  icon?: LucideIcon;
}

export function StatCard({ label, value, sublabel, delta, icon: Icon }: StatCardProps) {
  const naik = (delta ?? 0) >= 0;
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {delta === null || delta === undefined ? null : (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                naik ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {naik ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {naik ? "+" : ""}
              {delta.toFixed(1).replace(".", ",")}%
            </span>
          )}
          {sublabel ? <span className="text-muted-foreground">{sublabel}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}