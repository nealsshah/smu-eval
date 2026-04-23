"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  X,
  Check,
  Pencil,
  Lock,
  Unlock,
  Calendar,
  Users,
  ClipboardList,
} from "lucide-react";

interface CycleData {
  cycle_id: string;
  status: string | null;
  open_datetime: string | null;
  close_datetime: string | null;
  course_name: string;
  group_name: string;
  submitted_count: number;
  draft_count: number;
  expected_count: number;
  member_count: number;
  is_past_due: boolean;
}

type FilterTab = "all" | "active" | "closed";

export function EvaluationCycleList({ cycles }: { cycles: CycleData[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState("");
  const [editClose, setEditClose] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeCycles = cycles.filter(
    (c) => c.status === "Open" && !c.is_past_due
  );
  const closedCycles = cycles.filter(
    (c) => c.status === "Closed" || c.is_past_due
  );

  const filtered =
    filter === "active"
      ? activeCycles
      : filter === "closed"
        ? closedCycles
        : cycles;

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDateFull(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusBadge(cycle: CycleData) {
    if (cycle.status === "Closed")
      return { label: "Closed", className: "bg-gray-100 text-gray-600" };
    if (cycle.is_past_due)
      return { label: "Past Due", className: "bg-red-50 text-red-700" };
    return { label: "Active", className: "bg-green-50 text-green-700" };
  }

  function getTimeRemaining(close: string | null) {
    if (!close) return null;
    const ms = new Date(close).getTime() - Date.now();
    if (ms <= 0) return null;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }

  async function handleAction(
    cycleId: string,
    method: "PUT" | "DELETE",
    body?: Record<string, unknown>
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/professor/schedule/${cycleId}`, {
        method,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Action failed.");
        setDeletingId(null);
        return;
      }
      setEditingId(null);
      setDeletingId(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: cycles.length },
    { key: "active", label: "Active", count: activeCycles.length },
    { key: "closed", label: "Closed", count: closedCycles.length },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-smu-gold" />
          <CardTitle>Evaluation Cycles</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-muted/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${
                filter === tab.key
                  ? "bg-white text-smu-text shadow-sm"
                  : "text-muted-foreground hover:text-smu-text"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-muted-foreground">({tab.count})</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2.5 text-sm mb-3 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {filter === "all"
              ? "No evaluation cycles yet. Create one to get started."
              : `No ${filter} cycles.`}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((cycle) => {
              const isEditing = editingId === cycle.cycle_id;
              const isDeleting = deletingId === cycle.cycle_id;
              const badge = getStatusBadge(cycle);
              const progressPct =
                cycle.expected_count > 0
                  ? Math.round(
                      (cycle.submitted_count / cycle.expected_count) * 100
                    )
                  : 0;
              const timeLeft = getTimeRemaining(cycle.close_datetime);

              if (isDeleting) {
                return (
                  <div
                    key={cycle.cycle_id}
                    className="border border-red-200 bg-red-50/50 rounded-lg p-3"
                  >
                    <p className="text-sm text-red-700 mb-2">
                      Delete cycle for{" "}
                      <span className="font-medium">{cycle.group_name}</span>?
                      {cycle.submitted_count > 0 &&
                        " Cannot delete — has submitted evaluations."}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingId(null)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleAction(cycle.cycle_id, "DELETE")
                        }
                        disabled={loading || cycle.submitted_count > 0}
                      >
                        Confirm Delete
                      </Button>
                    </div>
                  </div>
                );
              }

              if (isEditing) {
                return (
                  <div
                    key={cycle.cycle_id}
                    className="border border-smu-gold/30 bg-smu-gold/5 rounded-lg p-3 space-y-3"
                  >
                    <p className="text-sm font-medium">
                      {cycle.course_name} &middot; {cycle.group_name}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Opens
                        </label>
                        <Input
                          type="datetime-local"
                          value={editOpen}
                          onChange={(e) => setEditOpen(e.target.value)}
                          className="bg-white text-sm h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Deadline
                        </label>
                        <Input
                          type="datetime-local"
                          value={editClose}
                          onChange={(e) => setEditClose(e.target.value)}
                          className="bg-white text-sm h-8"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAction(cycle.cycle_id, "PUT", {
                            open_datetime: editOpen,
                            close_datetime: editClose,
                          })
                        }
                        disabled={loading}
                        className="bg-smu-gold hover:bg-smu-gold-hover text-white h-7 text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" /> Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cycle.cycle_id}
                  className="border rounded-lg p-3 hover:border-smu-gold/30 transition-colors group"
                >
                  {/* Top row: name + badge + actions */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {cycle.course_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cycle.group_name} &middot; {cycle.member_count} members
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {/* Action buttons — visible on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(cycle.cycle_id);
                            setEditOpen(
                              cycle.open_datetime
                                ? new Date(cycle.open_datetime)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            );
                            setEditClose(
                              cycle.close_datetime
                                ? new Date(cycle.close_datetime)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            );
                          }}
                          title="Edit dates"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-smu-text transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {cycle.status === "Open" ? (
                          <button
                            onClick={() =>
                              handleAction(cycle.cycle_id, "PUT", {
                                status: "Closed",
                              })
                            }
                            disabled={loading}
                            title="Close cycle"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-smu-text transition-colors"
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleAction(cycle.cycle_id, "PUT", {
                                status: "Open",
                              })
                            }
                            disabled={loading}
                            title="Reopen cycle"
                            className="p-1 rounded hover:bg-muted text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Unlock className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingId(cycle.cycle_id)}
                          title="Delete cycle"
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Date row */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDate(cycle.open_datetime)} —{" "}
                      {formatDateFull(cycle.close_datetime)}
                    </span>
                    {timeLeft && (
                      <span className="ml-auto text-orange-600 font-medium">
                        {timeLeft}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {cycle.submitted_count}/{cycle.expected_count} submitted
                        {cycle.draft_count > 0 && (
                          <span className="text-yellow-600">
                            &middot; {cycle.draft_count} drafts
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-smu-text">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPct === 100
                            ? "bg-green-500"
                            : progressPct > 50
                              ? "bg-smu-gold"
                              : "bg-blue-400"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
