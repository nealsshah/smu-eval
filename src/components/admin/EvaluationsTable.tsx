"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Search, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface EvalScore {
  criterion_id: string;
  score: string;
}

interface Evaluation {
  eval_id: string;
  cycle_id: string;
  semester: number;
  status: string | null;
  submitted_at: string | null;
  written_feedback: string | null;
  Student_PeerEvaluation_rater_student_idToStudent: {
    student_id: string;
    first_name: string;
    last_name: string;
  };
  Student_PeerEvaluation_ratee_student_idToStudent: {
    student_id: string;
    first_name: string;
    last_name: string;
  };
  EvaluationCycle: {
    Course: { course_name: string };
    ProjectGroup: { group_name: string };
  };
  PeerEvaluationScore: EvalScore[];
}

const CRITERIA_LABELS: Record<string, string> = {
  C1: "Contribution",
  C2: "Facilitation",
  C3: "Planning",
  C4: "Climate",
  C5: "Overall",
  C6: "Attendance",
};

export function EvaluationsTable({ initialEvaluations }: { initialEvaluations: Evaluation[] }) {
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Evaluation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = evaluations.filter((e) => {
    const rater = e.Student_PeerEvaluation_rater_student_idToStudent;
    const ratee = e.Student_PeerEvaluation_ratee_student_idToStudent;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${rater.first_name} ${rater.last_name}`.toLowerCase().includes(q) ||
      `${ratee.first_name} ${ratee.last_name}`.toLowerCase().includes(q) ||
      e.EvaluationCycle.Course.course_name.toLowerCase().includes(q) ||
      e.eval_id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/evaluations/${deleteTarget.eval_id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete evaluation");
        return;
      }
      setEvaluations((prev) => prev.filter((e) => e.eval_id !== deleteTarget.eval_id));
      toast.success("Evaluation deleted");
      setDeleteOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search evaluations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {["all", "Submitted", "Draft"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rater</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ratee</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Group</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => {
                  const rater = ev.Student_PeerEvaluation_rater_student_idToStudent;
                  const ratee = ev.Student_PeerEvaluation_ratee_student_idToStudent;
                  return (
                    <tr key={ev.eval_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-smu-text">
                          {rater.first_name} {rater.last_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-smu-text">
                          {ratee.first_name} {ratee.last_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {ev.EvaluationCycle.Course.course_name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {ev.EvaluationCycle.ProjectGroup.group_name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={ev.status === "Submitted" ? "default" : "secondary"}>
                          {ev.status || "Unknown"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(ev.submitted_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setDetailTarget(ev); setDetailOpen(true); }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeleteTarget(ev); setDeleteOpen(true); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No evaluations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {evaluations.length} evaluations
      </p>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Rater:</span>{" "}
                  <span className="font-medium">
                    {detailTarget.Student_PeerEvaluation_rater_student_idToStudent.first_name}{" "}
                    {detailTarget.Student_PeerEvaluation_rater_student_idToStudent.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ratee:</span>{" "}
                  <span className="font-medium">
                    {detailTarget.Student_PeerEvaluation_ratee_student_idToStudent.first_name}{" "}
                    {detailTarget.Student_PeerEvaluation_ratee_student_idToStudent.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Course:</span>{" "}
                  {detailTarget.EvaluationCycle.Course.course_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge variant={detailTarget.status === "Submitted" ? "default" : "secondary"}>
                    {detailTarget.status}
                  </Badge>
                </div>
              </div>

              {detailTarget.PeerEvaluationScore.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Scores</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {detailTarget.PeerEvaluationScore.map((s) => (
                      <div key={s.criterion_id} className="bg-muted/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-muted-foreground">
                          {CRITERIA_LABELS[s.criterion_id] || s.criterion_id}
                        </div>
                        <div className="font-heading text-lg">{s.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTarget.written_feedback && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Written Feedback</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {detailTarget.written_feedback}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Evaluation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this evaluation? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
