/** A tenant that is a member of a baseline group. */
export interface BaselineMember {
  clientTenantId: number;
  tenantFriendlyName?: string;
  tenantDnsName?: string;
  msTenantId?: string;
}

/** An item explicitly included in a custom baseline. */
export interface IncludedBaselineItem {
  policySnapshotId?: string;
  childCustomBaselineId?: string;
  policyCategoryProduct?: string;
  policyCategoryPrimaryGroup?: string;
  policyCategorySecondaryGroup?: string;
  alignAssignments?: boolean;
}

/** A baseline configuration group used for alignment scoring. */
export interface BaselineGroup {
  id: string;
  name: string;
  baselineClientTenantId: number;
  baselineTenantFriendlyName?: string;
  baselineTenantDnsName?: string;
  baselineMsTenantId?: string;
  alignedThreshold?: number;
  semiAlignedThreshold?: number;
  members?: BaselineMember[];
  mode?: string;
  autoAddNewPolicies?: boolean;
  isComplete?: boolean;
  isShared?: boolean;
  items?: IncludedBaselineItem[] | null;
}
