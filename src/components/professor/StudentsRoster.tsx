"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Students" subtitle="View and add students to your courses" />
        <AddStudentDialog
          courses={courses.map((c) => ({
            course_id: c.course_id,
            course_name: c.course_name,
            semester: c.semester,
          }))}
          onCreated={() => router.refresh()}
        />
      </div>

      {courses.map((course) => (
        <div key={course.course_id} className="mb-8">
          <h2 className="font-heading text-xl mb-3">
            {course.course_name}
            <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
              Semester {course.semester}
            </span>
            <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
              &middot; {course.students.length} student{course.students.length !== 1 && "s"}
            </span>
          </h2>

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
                      <div
                        key={student.student_id}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {student.student_id}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </>
  );
}
