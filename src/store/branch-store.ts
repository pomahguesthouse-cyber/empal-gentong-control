import { create } from "zustand";
import { persist } from "zustand/middleware";

// Pemilih cabang global yang dipakai seluruh halaman
interface BranchState {
  branchId: string | null; // null = semua cabang
  setBranchId: (id: string | null) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branchId: null,
      setBranchId: (id) => set({ branchId: id }),
    }),
    { name: "eg-cabang-aktif" },
  ),
);