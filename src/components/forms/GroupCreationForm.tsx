"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { event } from "@/lib/analytics/gtag";

interface CourseData {
  course_id: string;
  course_name: string;
  semester: number;
  students: {
    student_id: string;
    name: string;
    email: string;
    isGrouped: boolean;
  }[];
}

export function GroupCreationForm({ courses }: { courses: CourseData[] }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedCourse = courses.find((c) => c.course_id === courseId);
  const students = selectedCourse?.students || [];

  // Sort: ungrouped first
  const sortedStudents = [...students].sort((a, b) => {
    if (a.isGrouped === b.isGrouped) return 0;
    return a.isGrouped ? 1 : -1;
  });

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!courseId) { setError("Please select a course."); return; }
    if (!groupName.trim()) { setError("Please enter a group name."); return; }
    if (groupName.length > 20) { setError("Group name must be 20 characters or fewer."); return; }
    if (selectedStudents.size < 2) { setError("Select at least 2 students to form a group."); return; }

    setLoading(true);

    try {
      const res = await fetch("/api/professor/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          group_name: groupName,
          student_ids: Array.from(selectedStudents),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Could not create the group. Please try again.");
        return;
      }

      event("group_created");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4">
          <p className="font-medium">Group created. Students have been assigned.</p>
        </div>
        <Button onClick={() => router.push("/professor/groups")} variant="outline">
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-smu-text mb-1">Course</label>
          <Select value={courseId} onValueChange={(v) => { setCourseId(v ?? ""); setSelectedStudents(new Set()); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.course_id} value={c.course_id}>
                  {c.course_name} (Sem {c.semester})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-bold text-smu-text mb-1">Group Name</label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            maxLength={20}
            className="bg-white"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {groupName.length}/20
          </p>
        </div>

        {selectedCourse && (
          <div>
            <label className="block text-sm font-bold text-smu-text mb-2">
              Select Students ({selectedStudents.size} selected, min 2)
            </label>
            <Card>
              <CardContent className="p-0 max-h-72 overflow-y-auto">
                {sortedStudents.map((s) => (
                  <label
                    key={s.student_id}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                      s.isGrouped ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s.student_id)}
                      onChange={() => toggleStudent(s.student_id)}
                      disabled={s.isGrouped}
                      className="rounded border-smu-border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    {s.isGrouped && (
                      <span className="text-xs text-muted-foreground">Already grouped</span>
                    )}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-smu-gold hover:bg-smu-gold-hover text-white">
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>
    </form>
  );
}
