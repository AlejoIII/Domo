export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  imageUrl?: string | null;
  hireDate?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesListResponse {
  items: Employee[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface EmployeePayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  imageUrl?: string;
  hireDate?: string;
  notes?: string;
  isActive?: boolean;
}

export function employeeFullName(e: Pick<Employee, 'firstName' | 'lastName'>) {
  return `${e.firstName} ${e.lastName}`.trim();
}
