"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-smu-navy text-white flex flex-col shrink-0">
      <nav className="flex-1 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-5 py-3 text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-smu-gold font-medium border-r-2 border-smu-gold"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          Singapore Management<br />University
        </p>
      </div>
    </aside>
  );
}
