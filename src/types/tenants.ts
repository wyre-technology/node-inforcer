/** A tag associated with a tenant. */
export interface TenantTag {
  id: string;
  name: string;
  description?: string;
}

/** Summary of alignment status for a tenant against a baseline. */
export interface AlignmentSummary {
  alignedBaselineTenantId: number;
  alignedBaselineId: string;
  alignedBaselineName?: string;
  alignmentScore?: number;
  alignedThreshold?: number;
  semiAlignedThreshold?: number;
  lastAlignmentDateTime?: string;
}

/** A license associated with a tenant. */
export interface TenantLicense {
  sku: string;
}

/** A tenant in the Inforcer system. */
export interface Tenant {
  clientTenantId: number;
  tenantFriendlyName?: string;
  tenantDnsName?: string;
  msTenantId?: string;
  secureScore?: number;
  isBaseline?: boolean;
  lastBackupTimestamp?: string;
  recentChanges?: number;
  policyDiff?: string;
  tags?: TenantTag[];
  alignmentSummaries?: AlignmentSummary[];
  licenses?: TenantLicense[];
}
