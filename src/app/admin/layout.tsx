"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayoutDashboard } from "lucide-react";
import type { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebarItems={sidebarItems}>{children}</AppShell>;
}
