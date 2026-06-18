/** Summary of an Entra ID group (returned from the list endpoint). */
export interface TenantGroupSummary {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  visibility?: string;
  groupTypes: string[];
}

/** Full detail of an Entra ID group (returned from the by-ID endpoint). */
export interface TenantGroup {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  mailNickname?: string;
  visibility?: string;
  membershipRule?: string | null;
  groupTypes: string[];
  createdDateTime?: string;
  mailEnabled?: boolean;
  onPremisesSyncEnabled?: boolean;
  members?: Array<Record<string, unknown>>;
}

/** Options for listing/searching groups in a tenant. */
export interface GroupListOptions {
  search?: string;
  continuationToken?: string;
}
