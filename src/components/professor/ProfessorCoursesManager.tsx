"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Upload,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface GroupMember {
  Student: { student_id: string; first_name: string; last_name: string };
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
  _count: { Enrollment: number; EvaluationCycle: number };
  ProjectGroup: ProjectGroup[];
}

export function ProfessorCoursesManager({ initialCourses }: { initialCourses: Course[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Create course form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSemester, setNewSemester] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  function toggleExpand(courseId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  async function handleCreate() {
    setCreateError("");
    if (!newName.trim()) {
      setCreateError("Course name is required.");
      return;
    }
    const semester = parseInt(newSemester, 10);
    if (!semester || semester < 1) {
      setCreateError("Enter a valid semester number.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/professor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_name: newName.trim(), semester }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(typeof data.error === "string" ? data.error : "Failed to create course.");
        return;
      }
      toast.success("Course created");
      setShowCreate(false);
      setNewName("");
      setNewSemester("");
      router.refresh();
    } catch {
      setCreateError("Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Courses" subtitle="Manage your courses and import students" />
        <Button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-smu-gold hover:bg-smu-gold-hover text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Course
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6 animate-fade-up">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-smu-navy">Create Course</h3>
              <button
                onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="text-xs text-muted-foreground hover:text-smu-text"
              >
                Cancel
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {createError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Course Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="bg-white"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <Input
                  type="number"
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-white"
                  min={1}
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="bg-smu-gold hover:bg-smu-gold-hover text-white">
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No courses yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-8"></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Semester</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Enrolled</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Groups</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cycles</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => {
                    const isExpanded = expanded.has(course.course_id);
                    return (
                      <Fragment key={course.course_id}>
                        <tr className="border-b hover:bg-muted/30 transition-colors">
                          <td className="pl-2">
                            <Button variant="ghost" size="icon-xs" onClick={() => toggleExpand(course.course_id)}>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </Button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-smu-text">{course.course_name}</div>
                            <div className="text-xs text-muted-foreground">{course.course_id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{course.semester}</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{course._count.Enrollment}</td>
                          <td className="py-3 px-4 text-muted-foreground">{course.ProjectGroup.length}</td>
                          <td className="py-3 px-4 text-muted-foreground">{course._count.EvaluationCycle}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/professor/import?courseId=${course.course_id}`)}
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Import
                            </Button>
                          </td>
                        </tr>
                        {isExpanded && (
                          course.ProjectGroup.length > 0 ? (
                            course.ProjectGroup.map((group) => (
                              <tr key={group.group_id} className="bg-muted/20 border-b">
                                <td></td>
                                <td colSpan={6} className="py-2 px-4">
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
                            ))
                          ) : (
                            <tr className="bg-muted/20 border-b">
                              <td></td>
                              <td colSpan={6} className="py-3 px-4 text-sm text-muted-foreground">
                                No groups created yet.
                              </td>
                            </tr>
                          )
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {courses.length} course{courses.length !== 1 ? "s" : ""}
      </p>
    </>
  );
}
