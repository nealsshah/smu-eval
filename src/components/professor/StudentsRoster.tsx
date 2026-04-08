"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AddStudentDialog } from "./AddStudentDialog";

type Student = {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type CourseWithStudents = {
  course_id: string;
  course_name: string;
  semester: number;
  students: Student[];
};

export function StudentsRoster({ courses }: { courses: CourseWithStudents[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const allStudentIds = courses.flatMap((c) =>
    c.students.map((s) => s.student_id)
  );
  const uniqueStudentIds = [...new Set(allStudentIds)];

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCourse(course: CourseWithStudents) {
    const ids = course.students.map((s) => s.student_id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === uniqueStudentIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(uniqueStudentIds));
    }
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/professor/students/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: [...selected] }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete students.");
        return;
      }

      const data = await res.json();
      toast.success(`Deleted ${data.deleted_count} student(s).`);
      setSelected(new Set());
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Students" subtitle="View and manage students in your courses" />
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 data-icon="inline-start" />
              Delete {selected.size} student{selected.size !== 1 && "s"}
            </Button>
          )}
          <AddStudentDialog
            courses={courses.map((c) => ({
              course_id: c.course_id,
              course_name: c.course_name,
              semester: c.semester,
            }))}
            onCreated={() => router.refresh()}
          />
        </div>
      </div>

      {uniqueStudentIds.length > 0 && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary size-3.5"
              checked={selected.size === uniqueStudentIds.length}
              onChange={toggleAll}
            />
            Select all students ({uniqueStudentIds.length})
          </label>
        </div>
      )}

      {courses.map((course) => {
        const courseIds = course.students.map((s) => s.student_id);
        const allCourseSelected =
          courseIds.length > 0 && courseIds.every((id) => selected.has(id));
        const someCourseSelected =
          !allCourseSelected && courseIds.some((id) => selected.has(id));

        return (
          <div key={course.course_id} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {course.students.length > 0 && (
                <input
                  type="checkbox"
                  className="accent-primary size-3.5"
                  checked={allCourseSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someCourseSelected;
                  }}
                  onChange={() => toggleCourse(course)}
                />
              )}
              <h2 className="font-heading text-xl">
                {course.course_name}
                <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
                  Semester {course.semester}
                </span>
                <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
                  &middot; {course.students.length} student{course.students.length !== 1 && "s"}
                </span>
              </h2>
            </div>

            {course.students.length === 0 ? (
              <Card>
                <CardContent className="py-4 text-sm text-muted-foreground">
                  No students enrolled yet. Use &ldquo;Add Student&rdquo; to get started.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {course.students
                      .sort((a, b) => a.last_name.localeCompare(b.last_name))
                      .map((student) => (
                        <label
                          key={student.student_id}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="accent-primary size-3.5"
                            checked={selected.has(student.student_id)}
                            onChange={() => toggleStudent(student.student_id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {student.student_id}
                          </span>
                        </label>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} student{selected.size !== 1 ? "s" : ""}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected student accounts, remove them from all courses and groups, and delete their peer evaluations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
