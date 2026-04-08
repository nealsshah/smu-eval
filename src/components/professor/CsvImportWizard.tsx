"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CsvDropZone } from "./CsvDropZone";
import { ImportReviewTable } from "./ImportReviewTable";
import { parseCsv, validateCsvHeaders, mapHeaderIndices } from "@/lib/csv/parse";
import { validateCsvRows } from "@/lib/validations/import";
import type { CsvRow, RowValidationError } from "@/lib/validations/import";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Users,
  BookOpen,
} from "lucide-react";

type Course = { course_id: string; course_name: string; semester: number };

type ImportResult = {
  success: boolean;
  import_id: string;
  summary?: {
    total_rows: number;
    students_created: number;
    students_enrolled: number;
    groups_created: number;
  };
  errors?: RowValidationError[];
};

type Step = 1 | 2 | 3 | 4;

export function CsvImportWizard({
  initialCourses,
}: {
  initialCourses: Course[];
}) {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1: Course
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [courseId, setCourseId] = useState("");
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newSemester, setNewSemester] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseError, setCourseError] = useState("");

  // Step 2: Upload
  const [fileName, setFileName] = useState("");
  const [headerError, setHeaderError] = useState("");

  // Step 3: Review
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<RowValidationError[]>([]);

  // Step 4: Result
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");

  // Step labels for the progress indicator
  const steps = [
    { num: 1, label: "Course", icon: BookOpen },
    { num: 2, label: "Upload", icon: Upload },
    { num: 3, label: "Review", icon: Users },
    { num: 4, label: "Done", icon: CheckCircle2 },
  ] as const;

  const selectedCourse = courses.find((c) => c.course_id === courseId);

  // --- Step 1 handlers ---
  async function handleCreateCourse() {
    setCourseError("");
    if (!newCourseName.trim()) {
      setCourseError("Course name is required.");
      return;
    }
    const semester = parseInt(newSemester, 10);
    if (!semester || semester < 1) {
      setCourseError("Enter a valid semester number.");
      return;
    }

    setCreatingCourse(true);
    try {
      const res = await fetch("/api/professor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_name: newCourseName.trim(), semester }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCourseError(
          typeof data.error === "string" ? data.error : "Failed to create course."
        );
        return;
      }
      const newCourse: Course = {
        course_id: data.course_id,
        course_name: data.course_name,
        semester: data.semester,
      };
      setCourses((prev) => [...prev, newCourse]);
      setCourseId(data.course_id);
      setShowCreateCourse(false);
      setNewCourseName("");
      setNewSemester("");
    } catch {
      setCourseError("Something went wrong. Please try again.");
    } finally {
      setCreatingCourse(false);
    }
  }

  // --- Step 2 handlers ---
  const handleFileLoaded = useCallback(
    (text: string, name: string) => {
      setHeaderError("");
      setFileName(name);

      const { headers, rows: rawRows } = parseCsv(text);
      const headerCheck = validateCsvHeaders(headers);

      if (!headerCheck.valid) {
        setHeaderError(
          `Missing columns: ${headerCheck.missing.join(", ")}. Expected: First Name, Last Name, Email, Group.`
        );
        return;
      }

      const indices = mapHeaderIndices(headers);
      const mapped: CsvRow[] = rawRows.map((r) => ({
        first_name: r[indices.firstName] ?? "",
        last_name: r[indices.lastName] ?? "",
        email: r[indices.email] ?? "",
        group: r[indices.group] ?? "",
      }));

      setRows(mapped);
      const validationErrors = validateCsvRows(mapped);
      setErrors(validationErrors);
      setStep(3);
    },
    []
  );

  // --- Step 3 handlers ---
  function handleRowChange(index: number, field: keyof CsvRow, value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleDeleteRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    // Re-validate after deletion
    setErrors((prev) => {
      const remaining = prev
        .filter((e) => e.row !== index + 1)
        .map((e) => (e.row > index + 1 ? { ...e, row: e.row - 1 } : e));
      return remaining;
    });
  }

  function handleRevalidate() {
    const validationErrors = validateCsvRows(rows);
    setErrors(validationErrors);
  }

  // --- Step 4: Submit ---
  async function handleImport() {
    // Re-validate before submitting
    const validationErrors = validateCsvRows(rows);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setImporting(true);
    setImportError("");

    try {
      const res = await fetch("/api/professor/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          file_name: fileName,
          rows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setImportError(
            "Validation errors found. Please fix them and try again."
          );
        } else {
          setImportError(data.error || "Import failed. Please try again.");
        }
        return;
      }

      setResult(data as ImportResult);
      setStep(4);
    } catch {
      setImportError("Something went wrong. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isComplete = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`w-8 h-px ${
                    isComplete ? "bg-smu-gold" : "bg-smu-border"
                  }`}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isActive
                      ? "bg-smu-gold text-white"
                      : isComplete
                        ? "bg-smu-gold/20 text-smu-gold"
                        : "bg-smu-border/50 text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    isActive
                      ? "text-smu-text"
                      : isComplete
                        ? "text-smu-gold"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Select / Create Course */}
      {step === 1 && (
        <Card className="animate-fade-up">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-smu-navy">
              Select or Create a Course
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose an existing course to import students into, or create a new
              one.
            </p>

            {courseError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {courseError}
              </div>
            )}

            {/* Existing courses */}
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <Select
                value={courseId}
                onValueChange={(v) => {
                  setCourseId(v ?? "");
                  setCourseError("");
                }}
              >
                <SelectTrigger className="bg-white w-full">
                  <span className="flex flex-1 text-left">
                    {selectedCourse
                      ? `${selectedCourse.course_name} (Sem ${selectedCourse.semester})`
                      : "Select a course"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem
                      key={c.course_id}
                      value={c.course_id}
                      label={`${c.course_name} (Sem ${c.semester})`}
                    >
                      {c.course_name} (Sem {c.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Create new toggle */}
            {!showCreateCourse ? (
              <button
                onClick={() => setShowCreateCourse(true)}
                className="text-sm text-smu-gold hover:text-smu-gold-hover font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create a new course
              </button>
            ) : (
              <div className="border border-smu-border rounded-lg p-4 space-y-3 bg-smu-surface/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-smu-navy">
                    New Course
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateCourse(false);
                      setCourseError("");
                    }}
                    className="text-xs text-muted-foreground hover:text-smu-text"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Course Name
                    </label>
                    <Input
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="e.g. Software Engineering"
                      className="bg-white"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Semester
                    </label>
                    <Input
                      type="number"
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value)}
                      placeholder="e.g. 1"
                      className="bg-white"
                      min={1}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateCourse}
                  disabled={creatingCourse}
                  className="bg-smu-gold hover:bg-smu-gold-hover text-white"
                >
                  {creatingCourse ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!courseId}
                className="bg-smu-navy hover:bg-smu-navy-light text-white"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload CSV */}
      {step === 2 && (
        <Card className="animate-fade-up">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-smu-navy">
              Upload Student CSV
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: <strong>First Name</strong>,{" "}
              <strong>Last Name</strong>, <strong>Email</strong>, and{" "}
              <strong>Group</strong>.
            </p>

            {selectedCourse && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-smu-navy/5 text-sm">
                <BookOpen className="w-4 h-4 text-smu-navy" />
                <span className="font-medium">
                  {selectedCourse.course_name}
                </span>
                <span className="text-muted-foreground">
                  (Sem {selectedCourse.semester})
                </span>
              </div>
            )}

            {headerError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{headerError}</span>
              </div>
            )}

            <CsvDropZone onFileLoaded={handleFileLoaded} />

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Edit */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-up">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-smu-navy">
                    Review & Edit
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Review the imported data below. Fix any errors before
                    importing.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {rows.length} row{rows.length !== 1 ? "s" : ""}
                  </span>
                  {errors.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {errors.length} error{errors.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      No errors
                    </span>
                  )}
                </div>
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}

              <ImportReviewTable
                rows={rows}
                errors={errors}
                onRowChange={handleRowChange}
                onDeleteRow={handleDeleteRow}
              />

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleRevalidate}>
                    Re-validate
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={
                      importing || errors.length > 0 || rows.length === 0
                    }
                    className="bg-smu-gold hover:bg-smu-gold-hover text-white"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1" />
                        Import {rows.length} Student
                        {rows.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <Card className="animate-fade-up">
          <CardContent className="p-6">
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-smu-navy">
                  Import Successful
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Students have been imported into{" "}
                  <strong>{selectedCourse?.course_name}</strong>.
                </p>
              </div>

              {result.summary && (
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
                  <div className="rounded-lg bg-smu-surface p-3">
                    <p className="text-2xl font-bold text-smu-navy">
                      {result.summary.students_created}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Students Created
                    </p>
                  </div>
                  <div className="rounded-lg bg-smu-surface p-3">
                    <p className="text-2xl font-bold text-smu-navy">
                      {result.summary.students_enrolled}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Already Existing
                    </p>
                  </div>
                  <div className="rounded-lg bg-smu-surface p-3">
                    <p className="text-2xl font-bold text-smu-navy">
                      {result.summary.groups_created}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Groups Created
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setCourseId("");
                    setFileName("");
                    setRows([]);
                    setErrors([]);
                    setResult(null);
                    setImportError("");
                  }}
                >
                  Import Another
                </Button>
                <Button
                  onClick={() => router.push("/professor/students")}
                  className="bg-smu-gold hover:bg-smu-gold-hover text-white"
                >
                  View Students
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Default password for new students:{" "}
                <code className="bg-smu-surface px-1.5 py-0.5 rounded font-mono">
                  Welcome123
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
