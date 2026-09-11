export interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  companyId: string;
  usersCount: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface RolePayload {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface CompanyUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string | null;
  isActive: boolean;
  role?: { id: string; name: string } | null;
}
