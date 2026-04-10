// config.js — shared CONFIG for all MRT conditions.
// ROTATION_ENABLED is set at runtime by introNext() based on selected condition.

export const CONFIG = {
  SEED:                  14,    // Deterministic RNG seed (all conditions use 14 for cross-condition consistency)
  TRIALS_PER_BLOCK:      5,     // Number of trials in Block A
  TIME_LIMIT_SECONDS:    300,   // 5-minute time limit for Block A
  REST_SECONDS:          60,    // Rest interval between blocks (reserved)
  PRACTICE_ENABLED:      true,  // Show practice trials before Block A
  PRACTICE_TRIALS:       2,     // Number of practice trials
  ROTATION_ENABLED:      false, // Set to true at runtime for 3D condition
  FIXATION_CROSS:        true,  // Show fixation cross between trials
  FIXATION_MS:           500,   // Fixation cross duration (ms)
  PARTICIPANT_ID_PROMPT: true,  // Require participant ID entry (always true in merged suite)
  // VR-specific
  VR_FIGURE_SCALE:       0.030, // Target figure scale — ~12 cm total (20 % bigger than v2)
  VR_OPTION_SCALE:       0.02,  // Option figure scale (passed to OptionCell; visual size set by cell.group.scale)
  VR_GRAB_RADIUS:        0.17,  // Grab detection sphere radius (metres) — scaled 20 % with figure
};
