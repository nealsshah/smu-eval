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
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
  const [success, setSuccess] = useState(false);

  const selectedCourse = courses.find((c) => c.course_id === courseId);
  const groups = selectedCourse?.groups || [];
  const selectedGroup = groups.find((g) => g.group_id === groupId);

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

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Could not create the evaluation cycle. Please try again.");
        return;
      }

      event("schedule_created");
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="animate-fade-up">
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 mb-4 flex items-start gap-4">
          <div className="shrink-0 animate-check-circle">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="17" fill="#22C55E" opacity="0.15" />
              <circle cx="18" cy="18" r="17" stroke="#22C55E" strokeWidth="1.5" />
              <path
                d="M12 18.5L16 22.5L24 14.5"
                stroke="#16A34A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check-draw"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium">Evaluation cycle created. Students can now submit evaluations during the open period.</p>
            <Button onClick={() => setSuccess(false)} variant="outline" className="mt-3" size="sm">
              Create Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-alert-in">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-smu-text mb-1">Course</label>
        <Select value={courseId} onValueChange={(v) => { setCourseId(v ?? ""); setGroupId(""); }}>
          <SelectTrigger className="bg-white">
            <span className="flex flex-1 text-left">
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
        <div>
          <label className="block text-sm font-bold text-smu-text mb-1">Group</label>
          <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
            <SelectTrigger className="bg-white">
              <span className="flex flex-1 text-left">
                {selectedGroup ? `${selectedGroup.group_name} (${selectedGroup.students.length} members)` : "Select a group"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.group_id} value={g.group_id} label={`${g.group_name} (${g.students.length} members)`}>
                  {g.group_name} ({g.students.length} members)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-smu-text mb-1">Start Date</label>
          <Input
            type="datetime-local"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
            className="bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-smu-text mb-1">Due Date</label>
          <Input
            type="datetime-local"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-smu-text mb-1">Notes (optional)</label>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          maxLength={250}
          rows={3}
          placeholder="Add any instructions or context for this evaluation cycle..."
          className="bg-white"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{comments.length}/250</p>
      </div>

      <Button type="submit" disabled={loading} className="bg-smu-gold hover:bg-smu-gold-hover text-white">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin-slow" />
            Creating…
          </span>
        ) : "Create Evaluation Cycle"}
      </Button>
    </form>
  );
}
