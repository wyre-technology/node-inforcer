/** A tag associated with a policy. */
export interface PolicyTag {
  id: string;
  name: string;
  description?: string;
}

/** A policy associated with a tenant. */
export interface Policy {
  id: string;
  policyTypeId?: number;
  name?: string;
  displayName?: string;
  friendlyName?: string;
  description?: string;
  readOnly?: boolean;
  product?: string;
  primaryGroup?: string;
  secondaryGroup?: string;
  platform?: string;
  policyCategoryId?: number;
  tags?: PolicyTag[];
  policyData?: Record<string, unknown>;
}
