import { cn } from "@/lib/utils";

type StatusType = "complete" | "incomplete" | "in-progress" | "draft" | "submitted";

const statusConfig: Record<StatusType, { style: string; label: string; dot: string }> = {
  complete: { style: "bg-green-50 text-green-700 ring-1 ring-green-200", label: "Complete", dot: "bg-green-500" },
  submitted: { style: "bg-green-50 text-green-700 ring-1 ring-green-200", label: "Submitted", dot: "bg-green-500" },
  incomplete: { style: "bg-gray-50 text-gray-500 ring-1 ring-gray-200", label: "Not Started", dot: "bg-gray-400" },
  "in-progress": { style: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", label: "In Progress", dot: "bg-amber-500" },
  draft: { style: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", label: "Draft", dot: "bg-amber-500" },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const config = statusConfig[status];
  const isPending = status === "in-progress" || status === "draft";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.style
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot, isPending && "animate-status-pulse")} />
      {config.label}
    </span>
  );
}
