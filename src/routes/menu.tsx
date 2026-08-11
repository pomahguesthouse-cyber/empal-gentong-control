import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { HargaCabangTab } from "@/components/menu/harga-cabang-tab";
import { HargaOjolTab } from "@/components/menu/harga-ojol-tab";
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
        content: "Kelola kategori, menu, varian, modifier, harga per cabang, dan harga jual di GoFood & GrabFood.",
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
        description="Kategori, menu, varian, modifier, harga tiap cabang, dan harga jual di GoFood & GrabFood."
      />
      <Tabs defaultValue="katalog">
        <TabsList>
          <TabsTrigger value="katalog">Kategori &amp; menu</TabsTrigger>
          <TabsTrigger value="varian">Varian</TabsTrigger>
          <TabsTrigger value="modifier">Modifier</TabsTrigger>
          <TabsTrigger value="harga">Harga per cabang</TabsTrigger>
          <TabsTrigger value="ojol">Harga ojol</TabsTrigger>
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
        <TabsContent value="ojol" className="mt-4">
          <HargaOjolTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
