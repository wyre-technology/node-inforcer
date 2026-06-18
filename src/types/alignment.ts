/** The alignment score for a tenant against a baseline. */
export interface AlignmentScore {
  tenantId: number;
  tenantFriendlyName?: string;
  score?: number;
  baselineGroupId?: string;
  baselineGroupName?: string;
  lastComparisonDateTime?: string;
}
