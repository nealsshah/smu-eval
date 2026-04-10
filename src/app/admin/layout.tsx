"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayoutDashboard, Users, UserCheck, BookOpen, ClipboardList, FileText } from "lucide-react";
import type { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Professors", href: "/admin/professors", icon: UserCheck },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Evaluations", href: "/admin/evaluations", icon: ClipboardList },
  { label: "Reports", href: "/admin/reports", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebarItems={sidebarItems}>{children}</AppShell>;
}
