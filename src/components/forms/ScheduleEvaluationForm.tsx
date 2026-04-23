"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Loader2, Send, RotateCcw } from "lucide-react";
import { event } from "@/lib/analytics/gtag";

interface CourseData {
  course_id: string;
  course_name: string;
  semester: number;
  groups: {
    group_id: string;
    group_name: string;
    students: { student_id: string; name: string }[];
    cycles: {
      cycle_id: string;
      status: string | null;
      open_datetime: string | null;
      close_datetime: string | null;
    }[];
  }[];
}

export function ScheduleEvaluationForm({ courses }: { courses: CourseData[] }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedCourse = courses.find((c) => c.course_id === courseId);
  const groups = selectedCourse?.groups || [];
  const selectedGroup = groups.find((g) => g.group_id === groupId);
  const isAllGroups = groupId === "__all__";

  const totalStudents = isAllGroups
    ? groups.reduce((sum, g) => sum + g.students.length, 0)
    : selectedGroup?.students.length || 0;

  function resetForm() {
    setSuccessMessage("");
    setCourseId("");
    setGroupId("");
    setOpenDate("");
    setCloseDate("");
    setComments("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!courseId) { setError("Please select a course."); return; }
    if (!groupId) { setError("Please select a group."); return; }
    if (!openDate) { setError("Please set a start date."); return; }
    if (!closeDate) { setError("Please set a due date."); return; }
    if (new Date(closeDate) <= new Date(openDate)) {
      setError("The due date must be after the start date.");
      return;
    }
    if (comments.length > 250) { setError("Notes cannot exceed 250 characters."); return; }

    setLoading(true);

    try {
      const res = await fetch("/api/professor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          group_id: groupId,
          open_datetime: openDate,
          close_datetime: closeDate,
          comments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create the evaluation cycle. Please try again.");
        return;
      }

      event("schedule_created");

      if (isAllGroups && data.message) {
        setSuccessMessage(data.message);
      } else {
        setSuccessMessage("Evaluation cycle created — students have been notified.");
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="animate-fade-up">
        <div className="flex flex-col items-center text-center py-4">
          <div className="animate-check-circle mb-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" fill="#22C55E" opacity="0.12" />
              <circle cx="24" cy="24" r="23" stroke="#22C55E" strokeWidth="1.5" />
              <path
                d="M16 24.5L21 29.5L32 18.5"
                stroke="#16A34A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check-draw"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-green-800 mb-4">{successMessage}</p>
          <Button onClick={resetForm} variant="outline" size="sm">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Schedule Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-alert-in">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-smu-text mb-1.5">Course</label>
        <Select value={courseId} onValueChange={(v) => { setCourseId(v ?? ""); setGroupId(""); }}>
          <SelectTrigger className="bg-white">
            <span className="flex flex-1 text-left truncate">
              {selectedCourse ? `${selectedCourse.course_name} (Sem ${selectedCourse.semester})` : "Select a course"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.course_id} value={c.course_id} label={`${c.course_name} (Sem ${c.semester})`}>
                {c.course_name} (Sem {c.semester})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCourse && (
        <div className="animate-fade-up">
          <label className="block text-sm font-medium text-smu-text mb-1.5">Group</label>
          <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
            <SelectTrigger className="bg-white">
              <span className="flex flex-1 text-left truncate">
                {isAllGroups
                  ? `All Groups (${groups.length})`
                  : selectedGroup
                    ? `${selectedGroup.group_name} (${selectedGroup.students.length} members)`
                    : "Select a group"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {groups.length > 1 && (
                <SelectItem value="__all__" label={`All Groups (${groups.length})`}>
                  <span className="font-medium">All Groups</span>
                  <span className="text-muted-foreground ml-1">({groups.length} groups)</span>
                </SelectItem>
              )}
              {groups.map((g) => (
                <SelectItem key={g.group_id} value={g.group_id} label={`${g.group_name} (${g.students.length} members)`}>
                  {g.group_name} ({g.students.length} members)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {groupId && (
        <div className="animate-fade-up space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-smu-text mb-1.5">Opens</label>
              <Input
                type="datetime-local"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-smu-text mb-1.5">Deadline</label>
              <Input
                type="datetime-local"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-smu-text mb-1.5">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={250}
              rows={2}
              placeholder="Instructions or context for students..."
              className="bg-white text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{comments.length}/250</p>
          </div>

          {(openDate && closeDate) && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              {isAllGroups
                ? `${groups.length} groups · ${totalStudents} students will be emailed`
                : `${totalStudents} student(s) will be emailed`}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-smu-gold hover:bg-smu-gold-hover text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin-slow" />
                {isAllGroups ? "Scheduling…" : "Scheduling…"}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                {isAllGroups ? `Schedule All ${groups.length} Groups` : "Schedule Evaluation"}
              </span>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
