/**
 * Type Strike — Engine Module
 *
 * Barrel export for the complete typing engine.
 * Consumers import from "@/engine" for the full public API.
 */

// Interfaces
export type {
  TextBundle,
  ITextProvider,
  KeyEvent,
  IInputSource,
  ITimerStrategy,
  IScoringStrategy,
  LevelThreshold,
  IComboSystem,
  ITelemetryPipeline,
  TelemetryEvent,
  GameResult,
  CharResult,
} from "./interfaces";

// Core Engine
export { TypingEngine } from "./TypingEngine";

// Implementations
export {
  KeyboardInputSource,
  NoTimer,
  CountdownTimer,
  StandardScoring,
  StandardComboSystem,
  TelemetryPipeline,
  StallDetector,
  LevelTextProvider,
  ContestTextProvider,
  FreePracticeTextProvider,
  EnterpriseTextProvider,
} from "./implementations";
