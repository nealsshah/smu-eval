export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || "";

export function pageview(url: string) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

export function event(action: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  window.gtag("event", action, params);
}
