import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, ClipboardList, UserCheck } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireAuth("admin");

  const [studentCount, professorCount, courseCount, evalCount] = await Promise.all([
    prisma.student.count(),
    prisma.professor.count({ where: { role: "Professor" } }),
    prisma.course.count(),
    prisma.peerEvaluation.count({ where: { status: "Submitted" } }),
  ]);

  const stats = [
    {
      label: "Students",
      value: studentCount,
      icon: Users,
      color: "bg-smu-navy",
      iconBg: "bg-smu-navy/10",
      iconColor: "text-smu-navy",
      href: "/admin/students",
    },
    {
      label: "Professors",
      value: professorCount,
      icon: UserCheck,
      color: "bg-smu-gold",
      iconBg: "bg-smu-gold/10",
      iconColor: "text-smu-gold",
      href: "/admin/professors",
    },
    {
      label: "Courses",
      value: courseCount,
      icon: BookOpen,
      color: "bg-smu-navy",
      iconBg: "bg-smu-navy/10",
      iconColor: "text-smu-navy",
      href: "/admin/courses",
    },
    {
      label: "Evaluations",
      value: evalCount,
      icon: ClipboardList,
      color: "bg-green-500",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      href: "/admin/evaluations",
      subtitle: "submitted",
    },
  ];

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="System overview" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger-children">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
                <div className={`absolute top-0 left-0 right-0 h-1 ${stat.color}`} />
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                    <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="font-heading text-4xl text-smu-text">{stat.value}</div>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  )}
                  <p className="text-xs text-smu-gold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Manage →
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
