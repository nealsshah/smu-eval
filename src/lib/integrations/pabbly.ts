const PABBLY_EVALUATION_WEBHOOK_URL = process.env.PABBLY_EVALUATION_WEBHOOK_URL;

async function sendWebhook(eventType: string, payload: Record<string, unknown>) {
  if (!PABBLY_EVALUATION_WEBHOOK_URL) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Pabbly] Webhook not configured. Event: ${eventType}`, payload);
    }
    return;
  }

  try {
    const res = await fetch(PABBLY_EVALUATION_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() }),
    });
    console.log(`[Pabbly] Webhook sent: ${eventType} → ${payload.professor_email || "unknown"} (status ${res.status})`);
  } catch (error) {
    console.error(`[Pabbly] Webhook failed for ${eventType}:`, error);
  }
}

export function sendEvaluationSubmittedWebhook(payload: Record<string, unknown>) {
  return sendWebhook("evaluation_submitted", payload);
}

export function sendEvaluationScheduledWebhook(payload: Record<string, unknown>) {
  return sendWebhook("evaluation_scheduled", payload);
}

export function sendGroupCreatedWebhook(payload: Record<string, unknown>) {
  return sendWebhook("group_created", payload);
}

export function sendImportCompletedWebhook(payload: Record<string, unknown>) {
  return sendWebhook("import_completed", payload);
}

const PABBLY_EVAL_SCHEDULED_WEBHOOK_URL = process.env.PABBLY_EVAL_SCHEDULED_WEBHOOK_URL;

export async function sendEvalScheduledStudentWebhook(payload: {
  student_email: string;
  student_name: string;
  professor_name: string;
  course_name: string;
  group_name: string;
  deadline: string;
  open_date: string;
}) {
  if (!PABBLY_EVAL_SCHEDULED_WEBHOOK_URL) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Pabbly] Eval scheduled webhook not configured.", payload);
    }
    return;
  }

  try {
    const formBody = new URLSearchParams(
      Object.entries(payload).map(([k, v]) => [k, String(v)])
    );
    const res = await fetch(PABBLY_EVAL_SCHEDULED_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });
    console.log(
      `[Pabbly] Eval scheduled webhook sent for ${payload.student_email} (status ${res.status})`
    );
  } catch (error) {
    console.error(
      `[Pabbly] Eval scheduled webhook failed for ${payload.student_email}:`,
      error
    );
  }
}

const PABBLY_STUDENT_IMPORT_WEBHOOK_URL = process.env.PABBLY_STUDENT_IMPORT_WEBHOOK_URL;

export async function sendStudentImportedWebhook(payload: {
  student_email: string;
  student_name: string;
  professor_name: string;
  course_name: string;
  group_number: string;
  ppl_in_group: number;
}) {
  // Only trigger for non-SMU emails
  if (payload.student_email.toLowerCase().endsWith("@smu.edu")) {
    return;
  }

  if (!PABBLY_STUDENT_IMPORT_WEBHOOK_URL) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Pabbly] Student import webhook not configured.", payload);
    }
    return;
  }

  try {
    const formBody = new URLSearchParams(
      Object.entries(payload).map(([k, v]) => [k, String(v)])
    );
    const res = await fetch(PABBLY_STUDENT_IMPORT_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });
    console.log(
      `[Pabbly] Student imported webhook sent for ${payload.student_email} (status ${res.status})`
    );
  } catch (error) {
    console.error(
      `[Pabbly] Student imported webhook failed for ${payload.student_email}:`,
      error
    );
  }
}
