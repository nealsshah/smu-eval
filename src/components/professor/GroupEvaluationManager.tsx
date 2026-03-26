"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Trash2, Users, Loader2 } from "lucide-react";

type Member = {
  student_id: string;
  first_name: string;
  last_name: string;
};

type Evaluation = {
  eval_id: string;
  cycle_id: string;
  rater_student_id: string;
  ratee_student_id: string;
  status: string | null;
  submitted_at: string | null;
  written_feedback: string | null;
  rater_name: string;
  ratee_name: string;
  scores: { criterion_id: string; score: number }[];
};

type GroupData = {
  members: Member[];
  evaluations: Evaluation[];
  group_name: string;
};

type GroupInfo = {
  group_id: string;
  group_name: string;
  members: { student_id: string; first_name: string; last_name: string }[];
};

type CourseWithGroups = {
  course_id: string;
  course_name: string;
  semester: number;
  groups: GroupInfo[];
};

function getEvalStatus(status: string | null): "submitted" | "draft" | "incomplete" {
  if (status === "Submitted") return "submitted";
  if (status === "Draft") return "draft";
  return "incomplete";
}

function criterionLabel(id: string) {
  const labels: Record<string, string> = {
    C1: "Contribution",
    C2: "Facilitation",
    C3: "Planning",
    C4: "Team Climate",
    C5: "Overall",
    C6: "Attendance",
  };
  return labels[id] || id;
}

export function GroupEvaluationManager({ courses }: { courses: CourseWithGroups[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [groupData, setGroupData] = useState<Record<string, GroupData>>({});
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleGroup = useCallback(
    async (groupId: string) => {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(groupId)) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }
        return next;
      });

      // Fetch data if not already loaded
      if (!groupData[groupId] && !loadingGroups.has(groupId)) {
        setLoadingGroups((prev) => new Set(prev).add(groupId));
        try {
          const res = await fetch(`/api/professor/groups/${groupId}/evaluations`);
          if (res.ok) {
            const data = await res.json();
            setGroupData((prev) => ({ ...prev, [groupId]: data }));
          }
        } finally {
          setLoadingGroups((prev) => {
            const next = new Set(prev);
            next.delete(groupId);
            return next;
          });
        }
      }
    },
    [groupData, loadingGroups]
  );

  const toggleStudent = (key: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/professor/evaluations/${deleteTarget.eval_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Remove evaluation from local state
        setGroupData((prev) => {
          const updated = { ...prev };
          for (const [gid, data] of Object.entries(updated)) {
            updated[gid] = {
              ...data,
              evaluations: data.evaluations.filter(
                (e) => e.eval_id !== deleteTarget.eval_id
              ),
            };
          }
          return updated;
        });
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {courses.map((course) => (
        <div key={course.course_id} className="mb-8">
          <h2 className="font-heading text-xl mb-3">
            {course.course_name}
            <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
              Semester {course.semester}
            </span>
          </h2>

          {course.groups.length === 0 ? (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                No groups yet. Use the &ldquo;Create Group&rdquo; button to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {course.groups.map((group) => {
                const isExpanded = expandedGroups.has(group.group_id);
                const isLoading = loadingGroups.has(group.group_id);
                const data = groupData[group.group_id];

                return (
                  <Card key={group.group_id} className="overflow-hidden">
                    <button
                      onClick={() => toggleGroup(group.group_id)}
                      className="w-full text-left"
                    >
                      <CardHeader className="py-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <CardTitle className="text-sm">{group.group_name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          {group.members.length} members
                        </div>
                      </CardHeader>
                    </button>

                    {isExpanded && (
                      <CardContent className="pt-0 pb-3">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading evaluations...
                          </div>
                        ) : data ? (
                          <div className="space-y-2">
                            {data.members.map((member) => {
                              const studentKey = `${group.group_id}:${member.student_id}`;
                              const isStudentExpanded = expandedStudents.has(studentKey);

                              // Evaluations this student has made (as rater)
                              const outgoing = data.evaluations.filter(
                                (e) => e.rater_student_id === member.student_id
                              );

                              // All other members this student should evaluate
                              const peers = data.members.filter(
                                (m) => m.student_id !== member.student_id
                              );

                              return (
                                <div
                                  key={member.student_id}
                                  className="border rounded-lg overflow-hidden"
                                >
                                  <button
                                    onClick={() => toggleStudent(studentKey)}
                                    className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      {isStudentExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                      <span className="text-sm font-medium">
                                        {member.first_name} {member.last_name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-muted-foreground">
                                        {outgoing.filter((e) => e.status === "Submitted").length}/
                                        {peers.length} submitted
                                      </span>
                                    </div>
                                  </button>

                                  {isStudentExpanded && (
                                    <div className="border-t bg-muted/20">
                                      {peers.length === 0 ? (
                                        <p className="px-3 py-2 text-xs text-muted-foreground">
                                          No peers to evaluate.
                                        </p>
                                      ) : (
                                        <div className="divide-y">
                                          {peers.map((peer) => {
                                            const eval_ = outgoing.find(
                                              (e) => e.ratee_student_id === peer.student_id
                                            );
                                            const status = getEvalStatus(eval_?.status ?? null);

                                            return (
                                              <div
                                                key={peer.student_id}
                                                className="px-3 py-2.5 flex items-center justify-between gap-2"
                                              >
                                                <div className="flex items-center gap-3 min-w-0">
                                                  <div className="text-xs">
                                                    <span className="text-muted-foreground">Review for </span>
                                                    <span className="font-medium">
                                                      {peer.first_name} {peer.last_name}
                                                    </span>
                                                  </div>
                                                  <StatusBadge status={status} />
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                  {eval_ && eval_.scores.length > 0 && (
                                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                                      {eval_.scores
                                                        .map(
                                                          (s) =>
                                                            `${criterionLabel(s.criterion_id)}: ${s.score}`
                                                        )
                                                        .join(" · ")}
                                                    </span>
                                                  )}
                                                  {eval_ && (
                                                    <Button
                                                      variant="ghost"
                                                      size="icon-sm"
                                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget(eval_);
                                                      }}
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {group.members.map((m) => (
                              <span
                                key={m.student_id}
                                className="inline-flex items-center gap-1.5 bg-smu-navy/5 text-smu-text text-xs px-2.5 py-1.5 rounded-md"
                              >
                                {m.first_name} {m.last_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Evaluation</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.rater_name}</strong>&apos;s evaluation of{" "}
              <strong>{deleteTarget?.ratee_name}</strong>, including all scores and feedback.
              The student will need to re-submit their evaluation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Deleting...
                </>
              ) : (
                "Delete Evaluation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
