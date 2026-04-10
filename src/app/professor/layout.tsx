"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayoutDashboard, Users, GraduationCap, CalendarClock, BookOpen, FileText } from "lucide-react";
import type { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/professor/dashboard", icon: LayoutDashboard },
  { label: "Courses", href: "/professor/courses", icon: BookOpen },
  { label: "Students", href: "/professor/students", icon: GraduationCap },
  { label: "Groups", href: "/professor/groups", icon: Users },
  { label: "Schedule Evaluations", href: "/professor/evaluations/schedule", icon: CalendarClock },
  { label: "Reports", href: "/professor/reports", icon: FileText },
];

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebarItems={sidebarItems}>{children}</AppShell>;
}
