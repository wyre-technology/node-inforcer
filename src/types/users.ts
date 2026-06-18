/** License assignment on a user (used in both UserSummary and User). */
export interface UserLicense {
  sku?: string;
  skuId?: string;
  name?: string | null;
  capabilityStatus?: string;
  isExpired?: boolean;
  isCancelled?: boolean;
  state?: string;
}

/** Summary of a user, returned by the list/search users endpoint. */
export interface UserSummary {
  id: string;
  displayName?: string;
  userPrincipalName?: string;
  userType?: string;
  jobTitle?: string;
  department?: string;
  groups?: number;
  roles?: number;
  assignedLicenses?: UserLicense[];
  isGlobalAdmin?: boolean;
  isAccountEnabled?: boolean;
  isMfaRegistered?: boolean;
  isMfaCapable?: boolean;
}

/** Full detail for a single user, returned by the get-user-by-ID endpoint. */
export interface User {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  userPrincipalName?: string;
  userType?: string;
  jobTitle?: string;
  department?: string;
  mail?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  officeLocation?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  preferredLanguage?: string;
  accountEnabled?: boolean;
  usageLocation?: string;
  createdDateTime?: string;
  lastPasswordChangeDateTime?: string;
  lastSignInDateTime?: string;
  companyName?: string;
  employeeId?: string;
  employeeType?: string;
  employeeHireDate?: string;
  mailNickname?: string;
  onPremisesSyncEnabled?: boolean;
  manager?: { id: string } | null;
  groups?: Array<Record<string, unknown>>;
  roles?: Array<Record<string, unknown>>;
  devices?: Array<Record<string, unknown>>;
  appRoleAssignments?: Array<Record<string, unknown>>;
  assignedLicenses?: UserLicense[];
  isGlobalAdmin?: boolean;
  isCloudOnly?: boolean;
  isHybrid?: boolean;
  isMfaRegistered?: boolean;
  isMfaCapable?: boolean;
  isAllDevicesCompliant?: boolean;
  riskState?: string;
  riskDetail?: string;
  riskLevel?: string;
}

/** Options for listing/searching users in a tenant. */
export interface UserListOptions {
  search?: string;
  continuationToken?: string;
}
