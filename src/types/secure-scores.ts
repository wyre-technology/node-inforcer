/**
 * Microsoft Secure Score data for a tenant
 * (`GET /beta/tenants/{tenantId}/secureScores`).
 *
 * The community module does not expose this endpoint via a public cmdlet, so
 * its response shape is not formally documented. The raw payload is returned
 * as-is; known/common fields are typed and unknown extras preserved.
 */
export interface SecureScore {
  currentScore?: number;
  maxScore?: number;
  [key: string]: unknown;
}
