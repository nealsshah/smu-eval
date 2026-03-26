"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CRITERIA,
  CRITERIA_LABELS,
  CRITERIA_DESCRIPTIONS,
  MAX_COMMENT_LENGTH,
  MAX_SCORE,
  evaluationSubmitSchema,
} from "@/lib/validations/evaluation";
import { event } from "@/lib/analytics/gtag";

interface Props {
  courseId: string;
  targetStudentId: string;
  targetStudentName: string;
  peers: { student_id: string; name: string }[];
  initialScores: Record<string, number>;
  initialFeedback: string;
  isSubmitted: boolean;
  cycleCloseDate: string | null;
}

export function PeerEvaluationForm({
  courseId,
  targetStudentId,
  targetStudentName,
  peers,
  initialScores,
  initialFeedback,
  isSubmitted,
  cycleCloseDate,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [scores, setScores] = useState<Record<string, number | undefined>>(initialScores);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [selectedPeer, setSelectedPeer] = useState(targetStudentId);

  const totalPoints = Object.values(scores).reduce<number>(
    (sum, s) => sum + (s ?? 0),
    0
  );
  const maxPoints = CRITERIA.length * MAX_SCORE;

  function handleScoreChange(criterion: string, value: string) {
    setScores((prev) => ({
      ...prev,
      [criterion]: value ? parseFloat(value) : undefined,
    }));
  }

  function resetFields() {
    setScores({});
    setFeedback("");
    setError("");
  }

  async function saveDraft() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/student/evaluations/${courseId}/${selectedPeer}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores, written_feedback: feedback }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.toString() || "Failed to save draft.");
        return;
      }
      event("evaluation_draft_saved");
      router.refresh();
    } catch {
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function submitEvaluation() {
    setSubmitting(true);
    setError("");

    // Client-side validation
    const result = evaluationSubmitSchema.safeParse({
      ratee_student_id: selectedPeer,
      scores,
      written_feedback: feedback,
    });

    if (!result.success) {
      const errors = result.error.flatten();
      const messages = [
        ...Object.values(errors.fieldErrors).flat(),
        ...errors.formErrors,
      ];
      setError(messages.join(" "));
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/student/evaluations/${courseId}/${selectedPeer}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores, written_feedback: feedback }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.toString() || "Failed to submit.");
        return;
      }
      event("evaluation_submitted");
      setSuccess(true);
    } catch {
      setError("An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div>
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Evaluation Successfully Submitted!</p>
          <p className="text-sm mt-1">
            Your evaluation for {targetStudentName} has been recorded.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/student/peer-evaluations/${courseId}`)}
          variant="outline"
        >
          Back to Group Members
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main form */}
      <div className="flex-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {isSubmitted && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-sm">
            This evaluation has already been submitted.
          </div>
        )}

        {/* Course info (read-only) */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-smu-text mb-1">
            Evaluate Group Member
          </label>
          <Select
            value={selectedPeer}
            onValueChange={(val) => {
              if (!val) return;
              setSelectedPeer(val);
              router.push(`/student/peer-evaluations/${courseId}/${val}`);
            }}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select a group member" />
            </SelectTrigger>
            <SelectContent>
              {peers.map((p) => (
                <SelectItem key={p.student_id} value={p.student_id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rubric scoring table */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-smu-navy text-white">
                  <th className="text-left p-3 font-medium">Criterion</th>
                  <th className="text-center p-3 font-medium w-32">Score (0-5)</th>
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map((criterion, idx) => (
                  <tr
                    key={criterion}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-3">
                      <p className="font-medium">{CRITERIA_LABELS[criterion]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {CRITERIA_DESCRIPTIONS[criterion]}
                      </p>
                    </td>
                    <td className="p-3 text-center">
                      <Select
                        value={scores[criterion]?.toString() ?? ""}
                        onValueChange={(val) => handleScoreChange(criterion, val ?? "")}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="bg-white w-24 mx-auto">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
                            (val) => (
                              <SelectItem key={val} value={val.toString()}>
                                {val.toFixed(1)}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Overall Rating */}
        <Card className="mb-4">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="font-bold text-sm">Total Points</span>
            <span className="text-lg font-bold text-smu-navy">
              {totalPoints.toFixed(1)} / {maxPoints.toFixed(1)}
            </span>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-smu-text mb-1">
            Comments
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide written feedback about this team member..."
            maxLength={MAX_COMMENT_LENGTH}
            rows={4}
            disabled={isSubmitted}
            className="bg-white"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {feedback.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>

        {/* Actions */}
        {!isSubmitted && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetFields} disabled={saving || submitting}>
              Reset Fields
            </Button>
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saving || submitting}
              className="border-smu-gold text-smu-gold hover:bg-smu-gold/10"
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={submitEvaluation}
              disabled={saving || submitting}
              className="bg-smu-gold hover:bg-smu-gold-hover text-white"
            >
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </div>
        )}
      </div>

      {/* Validation Rules Panel */}
      <div className="w-64 shrink-0 hidden lg:block">
        <Card>
          <CardHeader className="bg-smu-gold text-white rounded-t-lg py-3">
            <CardTitle className="text-sm font-medium">Validation Rules</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-smu-gold mt-0.5">&#x2022;</span>
                All criteria must be completed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-smu-gold mt-0.5">&#x2022;</span>
                Scores range from 0.0 to 5.0
              </li>
              <li className="flex items-start gap-2">
                <span className="text-smu-gold mt-0.5">&#x2022;</span>
                Comments cannot exceed {MAX_COMMENT_LENGTH} characters
              </li>
              <li className="flex items-start gap-2">
                <span className="text-smu-gold mt-0.5">&#x2022;</span>
                Cannot evaluate yourself
              </li>
              <li className="flex items-start gap-2">
                <span className="text-smu-gold mt-0.5">&#x2022;</span>
                Cannot evaluate outside your group
              </li>
              {cycleCloseDate && (
                <li className="flex items-start gap-2">
                  <span className="text-smu-gold mt-0.5">&#x2022;</span>
                  Deadline: {new Date(cycleCloseDate).toLocaleDateString()}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
