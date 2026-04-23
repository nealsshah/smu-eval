import type { EvaluationCycle } from "@prisma/client";

/**
 * Pick the best active cycle from a list:
 * 1. Prefer "Open" status cycles where current time is within the open/close window
 * 2. Among those, pick the one with the latest close_datetime
 * 3. If none are currently active, return null (students cannot submit outside the window)
 */
export function pickActiveCycle(cycles: EvaluationCycle[]): EvaluationCycle | null {
  if (cycles.length === 0) return null;

  const now = new Date();

  // Only consider cycles that are Open AND within the date window
  const activeCycles = cycles.filter((c) => {
    if (c.status !== "Open") return false;
    const open = c.open_datetime;
    const close = c.close_datetime;
    if (!open || !close) return false;
    return now >= open && now <= close;
  });

  if (activeCycles.length > 0) {
    return activeCycles.sort(
      (a, b) =>
        (b.close_datetime?.getTime() ?? 0) - (a.close_datetime?.getTime() ?? 0)
    )[0];
  }

  return null;
}

/**
 * Get deadline info for display purposes.
 * Returns the cycle even if it's past due (for showing deadline info),
 * along with computed status.
 */
export function getCycleWithDeadlineInfo(cycles: EvaluationCycle[]) {
  if (cycles.length === 0) return null;

  const now = new Date();

  // First try active cycles
  const active = pickActiveCycle(cycles);
  if (active) {
    const close = active.close_datetime!;
    const msLeft = close.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));

    return {
      cycle: active,
      isActive: true,
      isPastDue: false,
      isUpcoming: false,
      daysLeft,
      hoursLeft,
      deadlineLabel:
        daysLeft <= 0
          ? `Due in ${hoursLeft} hour(s)`
          : daysLeft === 1
            ? "Due tomorrow"
            : `Due in ${daysLeft} days`,
    };
  }

  // Check for upcoming cycles (not yet open)
  const upcoming = cycles
    .filter((c) => c.status === "Open" && c.open_datetime && c.open_datetime > now)
    .sort((a, b) => (a.open_datetime?.getTime() ?? 0) - (b.open_datetime?.getTime() ?? 0));

  if (upcoming.length > 0) {
    return {
      cycle: upcoming[0],
      isActive: false,
      isPastDue: false,
      isUpcoming: true,
      daysLeft: 0,
      hoursLeft: 0,
      deadlineLabel: `Opens ${upcoming[0].open_datetime!.toLocaleDateString()}`,
    };
  }

  // Check for recently closed/past due
  const past = cycles
    .filter((c) => c.close_datetime && c.close_datetime < now)
    .sort((a, b) => (b.close_datetime?.getTime() ?? 0) - (a.close_datetime?.getTime() ?? 0));

  if (past.length > 0) {
    return {
      cycle: past[0],
      isActive: false,
      isPastDue: true,
      isUpcoming: false,
      daysLeft: 0,
      hoursLeft: 0,
      deadlineLabel: "Past due",
    };
  }

  return null;
}
