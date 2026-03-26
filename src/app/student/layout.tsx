"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayoutDashboard, ClipboardList, Users } from "lucide-react";
import type { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Peer Evaluations", href: "/student/peer-evaluations", icon: ClipboardList },
  { label: "Groups", href: "/student/groups", icon: Users },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebarItems={sidebarItems}>{children}</AppShell>;
}
