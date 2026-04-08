"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";
import type { CsvRow, RowValidationError } from "@/lib/validations/import";

type Props = {
  rows: CsvRow[];
  errors: RowValidationError[];
  onRowChange: (index: number, field: keyof CsvRow, value: string) => void;
  onDeleteRow: (index: number) => void;
};

export function ImportReviewTable({
  rows,
  errors,
  onRowChange,
  onDeleteRow,
}: Props) {
  function getErrorsForCell(
    rowIndex: number,
    column: string
  ): RowValidationError[] {
    return errors.filter(
      (e) => e.row === rowIndex + 1 && e.column === column
    );
  }

  function rowHasErrors(rowIndex: number): boolean {
    return errors.some((e) => e.row === rowIndex + 1);
  }

  return (
    <div className="border border-smu-border rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-smu-navy text-white">
              <th className="px-3 py-2.5 text-left font-medium w-12">#</th>
              <th className="px-3 py-2.5 text-left font-medium">First Name</th>
              <th className="px-3 py-2.5 text-left font-medium">Last Name</th>
              <th className="px-3 py-2.5 text-left font-medium">Email</th>
              <th className="px-3 py-2.5 text-left font-medium">Group</th>
              <th className="px-3 py-2.5 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const hasErrors = rowHasErrors(i);
              return (
                <tr
                  key={i}
                  className={`border-t border-smu-border transition-colors ${
                    hasErrors
                      ? "bg-red-50/50"
                      : "hover:bg-smu-surface/50"
                  }`}
                >
                  <td className="px-3 py-1.5 text-muted-foreground font-mono text-xs">
                    {i + 1}
                  </td>
                  {(
                    ["first_name", "last_name", "email", "group"] as const
                  ).map((field) => {
                    const cellErrors = getErrorsForCell(i, field);
                    return (
                      <td key={field} className="px-2 py-1">
                        <div className="relative">
                          <Input
                            value={row[field]}
                            onChange={(e) =>
                              onRowChange(i, field, e.target.value)
                            }
                            className={`h-8 text-sm bg-transparent border ${
                              cellErrors.length > 0
                                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                                : "border-transparent hover:border-smu-border focus:border-smu-gold"
                            }`}
                          />
                          {cellErrors.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5 px-1">
                              <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="text-xs text-red-600">
                                {cellErrors[0].message}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteRow(i)}
                      title="Remove row"
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No rows to display.
        </div>
      )}
    </div>
  );
}
