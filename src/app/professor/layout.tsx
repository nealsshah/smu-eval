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
  { label: "Reports", href: "https://virginiatech-my.sharepoint.com/:u:/r/personal/kimimontano_vt_edu/Documents/SMU%20Project/Sprint%201%20Reports.pbix?csf=1&web=1&e=FH1jsI", icon: FileText, external: true },
];

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebarItems={sidebarItems}>{children}</AppShell>;
}
