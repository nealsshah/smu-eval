import { cn } from "@/lib/utils";

type StatusType = "complete" | "incomplete" | "in-progress" | "draft" | "submitted";

const statusStyles: Record<StatusType, string> = {
  complete: "bg-green-100 text-green-800",
  submitted: "bg-green-100 text-green-800",
  incomplete: "bg-gray-100 text-gray-600",
  "in-progress": "bg-yellow-100 text-yellow-800",
  draft: "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<StatusType, string> = {
  complete: "Complete",
  submitted: "Submitted",
  incomplete: "Incomplete",
  "in-progress": "In Progress",
  draft: "Draft",
};

export function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
