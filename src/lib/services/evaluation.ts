import type { EvaluationCycle } from "@prisma/client";

/**
 * Pick the best active cycle from a list:
 * 1. Prefer "Open" status cycles
 * 2. Among those, pick the one with the latest close_datetime
 * 3. If none are Open, pick the most recent cycle overall
 */
export function pickActiveCycle(cycles: EvaluationCycle[]): EvaluationCycle | null {
  if (cycles.length === 0) return null;

  const openCycles = cycles.filter((c) => c.status === "Open");
  if (openCycles.length > 0) {
    return openCycles.sort(
      (a, b) =>
        (b.close_datetime?.getTime() ?? 0) - (a.close_datetime?.getTime() ?? 0)
    )[0];
  }

  // Fall back to most recent cycle
  return cycles.sort(
    (a, b) =>
      (b.close_datetime?.getTime() ?? 0) - (a.close_datetime?.getTime() ?? 0)
  )[0];
}
