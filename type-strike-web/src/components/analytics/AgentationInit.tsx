"use client";

import { useEffect } from "react";

/**
 * Client component that initializes the Agentation dev-only testing instrumentation.
 * Dynamically imports agentation.ts so it's tree-shaken in production builds.
 * This is a separate client component to keep the parent layout as a Server Component.
 */
export default function AgentationInit() {
  useEffect(() => {
    import("@/lib/agentation").then((mod) => mod.initAgentation()).catch(() => {
      // Silently fail — non-critical instrumentation
    });
  }, []);

  return null;
}
