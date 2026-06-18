/** An Entra ID directory role definition. */
export interface TenantRole {
  id: string;
  templateId?: string;
  displayName: string;
  description?: string;
  isBuiltIn?: boolean;
  isEnabled?: boolean;
  isPrivileged?: boolean;
}
