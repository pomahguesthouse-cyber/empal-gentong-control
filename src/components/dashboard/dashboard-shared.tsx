import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

// Placeholder saat data tabel sedang dimuat
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "h-[220px]" }: { className?: string }) {
  return <Skeleton className={className} />;
}

// Pesan kosong yang jelas, bukan tabel kosong tanpa keterangan
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

// Label jam gaya Indonesia: 7 -> "07.00"
export const labelJam = (hour: number): string => `${String(hour).padStart(2, "0")}.00`;
