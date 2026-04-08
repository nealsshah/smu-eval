import { z } from "zod";

export const createCourseSchema = z.object({
  course_name: z
    .string()
    .min(1, "Course name is required.")
    .max(100, "Course name cannot exceed 100 characters."),
  semester: z
    .number({ message: "Semester must be a number." })
    .int("Semester must be a whole number.")
    .positive("Semester must be a positive number."),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const csvRowSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required.")
    .max(100, "First name cannot exceed 100 characters."),
  last_name: z
    .string()
    .min(1, "Last name is required.")
    .max(100, "Last name cannot exceed 100 characters."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Invalid email format."),
  group: z
    .string()
    .min(1, "Group is required.")
    .max(100, "Group name cannot exceed 100 characters."),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export const importSubmissionSchema = z.object({
  course_id: z.string().min(1, "Course is required."),
  file_name: z.string().min(1, "File name is required."),
  rows: z.array(csvRowSchema).min(1, "At least one student row is required."),
});

export type ImportSubmission = z.infer<typeof importSubmissionSchema>;

export type RowValidationError = {
  row: number;
  column: string;
  value: string;
  message: string;
};

/** Validate an array of CSV rows and return all errors found. */
export function validateCsvRows(
  rows: CsvRow[]
): RowValidationError[] {
  const errors: RowValidationError[] = [];
  const emailsSeen = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const result = csvRowSchema.safeParse(row);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const column = issue.path[0] as string;
        errors.push({
          row: rowNum,
          column,
          value: (row as Record<string, string>)[column] ?? "",
          message: issue.message,
        });
      }
    }

    // Check for duplicate emails within the CSV
    if (row.email) {
      const emailLower = row.email.trim().toLowerCase();
      if (emailsSeen.has(emailLower)) {
        errors.push({
          row: rowNum,
          column: "email",
          value: row.email,
          message: `Duplicate email — same as row ${emailsSeen.get(emailLower)}.`,
        });
      } else {
        emailsSeen.set(emailLower, rowNum);
      }
    }
  }

  return errors;
}
