import { z } from "zod";

export const createGroupSchema = z.object({
  course_id: z.string().min(1, "Course is required."),
  group_name: z.string().min(1, "Group name is required.").max(20, "Group name cannot exceed 20 characters."),
  student_ids: z.array(z.string()).min(2, "At least 2 students are required."),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
