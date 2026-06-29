/**
 * Agentation — AI Testing & Monitoring Integration
 * ==================================================
 * 
 * This is a DEVELOPMENT-ONLY integration. It must never execute
 * in production builds.
 * 
 * See: https://www.agentation.com/
 * 
 * Usage:
 *   - In development: tracks API calls, UI interactions, and test sessions
 *   - In production: completely tree-shaken by the bundler
 * 
 * Environment variable:
 *   NEXT_PUBLIC_AGENTATION_API_KEY=<your_test_key>
 *   (set in .env.local — already in .gitignore)
 */

const AGENTATION_API_KEY = process.env.NEXT_PUBLIC_AGENTATION_API_KEY;

/**
 * Initialize Agentation SDK for testing purposes.
 * Only called in development mode — never in production.
 */
export function initAgentation(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (!AGENTATION_API_KEY) {
    console.info(
      "[Agentation] Skipping init: NEXT_PUBLIC_AGENTATION_API_KEY not set. " +
      "Add it to .env.local for testing integration."
    );
    return;
  }

  console.info("[Agentation] Initialized for development testing.");

  // TODO: Initialize Agentation SDK here once their JS/Next.js SDK is confirmed
  // Based on https://www.agentation.com/ docs, integration typically involves:
  // 1. Importing their SDK: import { Agentation } from "agentation-sdk";
  // 2. Initializing: Agentation.init({ apiKey: AGENTATION_API_KEY, env: "development" });
  // 3. Instrumenting: Agentation.track("page_view", { page: window.location.pathname });
  //
  // ⚠️ IMPORTANT: All Agentation imports must use dynamic import() so the
  //    bundler can tree-shake them in production builds.
}

/**
 * Track a custom event for testing purposes.
 * Only fires in development mode.
 */
export function trackEvent(eventName: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  console.info(`[Agentation] Track: ${eventName}`, data ?? {});
  // TODO: Call Agentation SDK track method once integrated
}
