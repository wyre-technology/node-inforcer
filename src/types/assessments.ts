/**
 * An assessment available for evaluation (e.g. Copilot Readiness, CIS
 * Benchmarks, Essential Eight). Field set is not formally documented by the
 * community module; common fields are typed here and unknown extras preserved.
 */
export interface Assessment {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Result of triggering an assessment run. The community module's run payload is
 * not documented as a fixed schema, so the raw run object is returned as-is.
 */
export interface AssessmentRun {
  [key: string]: unknown;
}
