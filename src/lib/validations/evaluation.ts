import { z } from "zod";

// Criteria IDs match the database (C1-C6)
export const CRITERIA = ["C1", "C2", "C3", "C4", "C5", "C6"] as const;

export const CRITERIA_LABELS: Record<string, string> = {
  C1: "Contribution to Team Project",
  C2: "Facilitates Contributions of Others",
  C3: "Planning and Management",
  C4: "Fosters a Team Climate",
  C5: "Overall",
  C6: "Attendance & Participation",
};

export const CRITERIA_DESCRIPTIONS: Record<string, string> = {
  C1: "Actively contributes to team deliverables and project goals",
  C2: "Encourages and supports other team members' participation",
  C3: "Helps plan, organize, and manage team activities",
  C4: "Creates a positive and collaborative team environment",
  C5: "Overall effectiveness as a team member",
  C6: "Attends meetings and participates meaningfully",
};

// Scores in the DB are Decimal(4,2) — range 0.00 to 4.00
export const MIN_SCORE = 0;
export const MAX_SCORE = 4;
export const MAX_COMMENT_LENGTH = 250;

export const evaluationDraftSchema = z.object({
  ratee_student_id: z.string().min(1, "Group member is required."),
  scores: z.record(
    z.string(),
    z.coerce
      .number()
      .min(MIN_SCORE)
      .max(MAX_SCORE)
      .optional()
  ),
  written_feedback: z.string().max(MAX_COMMENT_LENGTH, `Written feedback must be ${MAX_COMMENT_LENGTH} characters or fewer.`).optional(),
});

export const evaluationSubmitSchema = z.object({
  ratee_student_id: z.string().min(1, "Please select a group member."),
  scores: z.object(
    Object.fromEntries(
      CRITERIA.map((c) => [
        c,
        z.coerce
          .number({ error: `Please score "${CRITERIA_LABELS[c]}".` })
          .min(MIN_SCORE, `Score must be at least ${MIN_SCORE}.`)
          .max(MAX_SCORE, `Score must be ${MAX_SCORE} or lower.`),
      ])
    )
  ),
  written_feedback: z.string().max(MAX_COMMENT_LENGTH, `Written feedback must be ${MAX_COMMENT_LENGTH} characters or fewer.`).optional(),
});

export type EvaluationDraftInput = z.infer<typeof evaluationDraftSchema>;
export type EvaluationSubmitInput = z.infer<typeof evaluationSubmitSchema>;
