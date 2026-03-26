import { z } from "zod";

export const createScheduleSchema = z.object({
  student_id: z.string().min(1, "Student is required."),
  course_id: z.string().min(1, "Course is required."),
  scheduled_datetime: z.string().min(1, "Date and time are required.").refine(
    (val) => new Date(val) > new Date(),
    "Cannot schedule in the past."
  ),
  comments: z.string().max(250, "Comments cannot exceed 250 characters.").optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
