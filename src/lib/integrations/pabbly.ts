const PABBLY_WEBHOOK_URL = process.env.PABBLY_WEBHOOK_URL;

async function sendWebhook(eventType: string, payload: Record<string, unknown>) {
  if (!PABBLY_WEBHOOK_URL) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Pabbly] Webhook not configured. Event: ${eventType}`, payload);
    }
    return;
  }

  try {
    const res = await fetch(PABBLY_WEBHOOK_URL, {
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
