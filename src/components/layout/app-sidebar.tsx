import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  Users,
  BadgePercent,
  Grid3x3,
  Receipt,
  BarChart3,
  Wallet,
  ShieldAlert,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const grupMenu = [
  {
    label: "Ringkasan",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operasional",
    items: [
      { title: "Manajemen menu", url: "/menu", icon: UtensilsCrossed },
      { title: "Manajemen cabang", url: "/cabang", icon: Store },
      { title: "User & hak akses", url: "/pengguna", icon: Users },
      { title: "Promo & diskon", url: "/promo", icon: BadgePercent },
      { title: "Manajemen meja", url: "/meja", icon: Grid3x3 },
      { title: "Biaya operasional", url: "/biaya", icon: Receipt },
    ],
  },
  {
    label: "Laporan",
    items: [
      { title: "Laporan penjualan", url: "/laporan-penjualan", icon: BarChart3 },
      { title: "Laporan keuangan", url: "/laporan-keuangan", icon: Wallet },
      { title: "Kontrol & audit", url: "/kontrol", icon: ShieldAlert },
    ],
  },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            EG
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">Empal Gentong</p>
            <p className="truncate text-xs text-sidebar-foreground/70">Panel admin & laporan</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {grupMenu.map((grup) => (
          <SidebarGroup key={grup.label}>
            <SidebarGroupLabel>{grup.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grup.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}