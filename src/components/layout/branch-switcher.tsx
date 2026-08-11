import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ambilCabang } from "@/services/master-service";
import { useBranchStore } from "@/store/branch-store";

export function BranchSwitcher() {
  const { branchId, setBranchId } = useBranchStore();
  const { data: cabang = [] } = useQuery({ queryKey: ["branches"], queryFn: ambilCabang });

  return (
    <div className="flex items-center gap-2">
      <Store className="size-4 text-muted-foreground" />
      <Select value={branchId ?? "semua"} onValueChange={(v) => setBranchId(v === "semua" ? null : v)}>
        <SelectTrigger className="w-[140px] bg-card sm:w-[220px]">
          <SelectValue placeholder="Pilih cabang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semua">Semua cabang</SelectItem>
          {cabang.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} ({c.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}