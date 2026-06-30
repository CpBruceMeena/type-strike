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

// ── Dev-only session tracking ───────────────────────────

interface SessionEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

let eventBuffer: SessionEvent[] = [];
let initialized = false;

/**
 * Initialize Agentation SDK for testing purposes.
 * Only called in development mode — never in production.
 */
export function initAgentation(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (initialized) return;

  if (!AGENTATION_API_KEY) {
    console.info(
      "[Agentation] Skipping init: NEXT_PUBLIC_AGENTATION_API_KEY not set. " +
      "Add it to .env.local for testing integration."
    );
    return;
  }

  initialized = true;
  console.info("[Agentation] Initialized for development testing.");

  // Flush any buffered events on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      if (eventBuffer.length > 0) {
        console.info(`[Agentation] Flushing ${eventBuffer.length} events on unload`);
        flushEvents();
      }
    });

    // Track initial page view
    trackEvent("page_view", {
      path: window.location.pathname,
      referrer: document.referrer || undefined,
    });
  }
}

/**
 * Track a custom event for testing purposes.
 * Only fires in development mode.
 */
export function trackEvent(eventName: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;

  const event: SessionEvent = {
    type: eventName,
    timestamp: new Date().toISOString(),
    data: data ?? {},
  };

  eventBuffer.push(event);
  console.info(`[Agentation] Track: ${eventName}`, data ?? {});

  // Auto-flush every 10 events to keep buffer manageable
  if (eventBuffer.length >= 10) {
    flushEvents();
  }
}

/**
 * Track a game session completion (dev-only).
 */
export function trackGameComplete(params: {
  wpm: number;
  accuracy: number;
  mode: string;
  xpEarned: number;
}): void {
  if (process.env.NODE_ENV !== "development") return;
  trackEvent("game_complete", {
    wpm: params.wpm,
    accuracy: params.accuracy,
    mode: params.mode,
    xp_earned: params.xpEarned,
    success: params.wpm > 0,
  });
}

/**
 * Track a page navigation (dev-only).
 */
export function trackNavigation(path: string): void {
  if (process.env.NODE_ENV !== "development") return;
  trackEvent("navigation", { path });
}

/**
 * Flush all buffered events.
 * In a real SDK integration, this would send events to the Agentation backend.
 */
export function flushEvents(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (eventBuffer.length === 0) return;

  const payload = {
    apiKey: AGENTATION_API_KEY,
    events: [...eventBuffer],
    session_id: generateSessionId(),
  };

  // In development, log the payload to console
  // In production with actual SDK: Agentation.send(payload)
  console.info(`[Agentation] Flushing ${eventBuffer.length} event(s):`, payload);

  eventBuffer = [];
}

/**
 * Generate a simple session ID for grouping events.
 */
function generateSessionId(): string {
  if (typeof window === "undefined") return "server";
  const stored = sessionStorage.getItem("agentation_session_id");
  if (stored) return stored;
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem("agentation_session_id", id);
  return id;
}
