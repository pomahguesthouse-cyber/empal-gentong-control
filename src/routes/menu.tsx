import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { HargaCabangTab } from "@/components/menu/harga-cabang-tab";
import { KatalogTab } from "@/components/menu/katalog-tab";
import { ModifierTab } from "@/components/menu/modifier-tab";
import { VarianTab } from "@/components/menu/varian-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Manajemen Menu — Admin Empal Gentong" },
      {
        name: "description",
        content: "Kelola kategori, menu, varian, modifier, dan harga khusus per cabang.",
      },
    ],
  }),
  component: HalamanMenu,
});

function HalamanMenu() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen menu"
        description="Kategori, menu, varian, modifier, dan harga khusus tiap cabang."
      />
      <Tabs defaultValue="katalog">
        <TabsList>
          <TabsTrigger value="katalog">Kategori &amp; menu</TabsTrigger>
          <TabsTrigger value="varian">Varian</TabsTrigger>
          <TabsTrigger value="modifier">Modifier</TabsTrigger>
          <TabsTrigger value="harga">Harga per cabang</TabsTrigger>
        </TabsList>
        <TabsContent value="katalog" className="mt-4">
          <KatalogTab />
        </TabsContent>
        <TabsContent value="varian" className="mt-4">
          <VarianTab />
        </TabsContent>
        <TabsContent value="modifier" className="mt-4">
          <ModifierTab />
        </TabsContent>
        <TabsContent value="harga" className="mt-4">
          <HargaCabangTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
