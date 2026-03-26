"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayoutDashboard, Users, GraduationCap, CalendarClock, Download } from "lucide-react";
import type { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/professor/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/professor/students", icon: GraduationCap },
  { label: "Groups", href: "/professor/groups", icon: Users },
  { label: "Schedule Evaluations", href: "/professor/evaluations/schedule", icon: CalendarClock },
  { label: "Import", href: "/professor/import", icon: Download },
];

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebarItems={sidebarItems}>{children}</AppShell>;
}
