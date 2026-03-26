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
import { Trash2, Search, ChevronDown, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";

interface GroupMember {
  Student: { student_id: string; first_name: string; last_name: string; email: string };
}

interface ProjectGroup {
  group_id: string;
  group_name: string;
  GroupMember: GroupMember[];
}

interface Course {
  course_id: string;
  course_name: string;
  semester: number;
  professor_id: string;
  Professor: { full_name: string; email: string };
  ProjectGroup: ProjectGroup[];
  _count: { Enrollment: number; EvaluationCycle: number };
}

export function CoursesTable({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.course_name.toLowerCase().includes(q) ||
      c.course_id.toLowerCase().includes(q) ||
      c.Professor.full_name.toLowerCase().includes(q)
    );
  });

  function toggleExpand(courseId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.course_id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete course");
        return;
      }
      setCourses((prev) => prev.filter((c) => c.course_id !== deleteTarget.course_id));
      toast.success("Course deleted");
      setDeleteOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-8"></th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Professor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Semester</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Enrolled</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Groups</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cycles</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => {
                  const isExpanded = expanded.has(course.course_id);
                  return (
                    <>
                      <tr key={course.course_id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="pl-2">
                          {course.ProjectGroup.length > 0 && (
                            <Button variant="ghost" size="icon-xs" onClick={() => toggleExpand(course.course_id)}>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-smu-text">{course.course_name}</div>
                            <div className="text-xs text-muted-foreground">{course.course_id}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{course.Professor.full_name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{course.semester}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{course._count.Enrollment}</td>
                        <td className="py-3 px-4 text-muted-foreground">{course.ProjectGroup.length}</td>
                        <td className="py-3 px-4 text-muted-foreground">{course._count.EvaluationCycle}</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeleteTarget(course); setDeleteOpen(true); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && course.ProjectGroup.map((group) => (
                        <tr key={group.group_id} className="bg-muted/20 border-b">
                          <td></td>
                          <td colSpan={7} className="py-2 px-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Users className="w-3.5 h-3.5 text-smu-navy" />
                              <span className="font-medium text-sm">{group.group_name}</span>
                              <Badge variant="outline" className="text-xs">{group.GroupMember.length} members</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 ml-5.5">
                              {group.GroupMember.map((m) => (
                                <Badge key={m.Student.student_id} variant="secondary" className="text-xs">
                                  {m.Student.first_name} {m.Student.last_name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {courses.length} courses
      </p>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.course_name}</strong>?
            This will permanently remove all groups, evaluation cycles, and evaluations for this course.
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
