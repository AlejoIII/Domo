import { api } from './api';
import type { Employee, EmployeePayload, EmployeesListResponse } from '@/types/employee.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchEmployees(params: {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
}): Promise<EmployeesListResponse> {
  const res = await api.get('/employees', { params });
  return unwrap<EmployeesListResponse>(res.data);
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const res = await api.get(`/employees/${id}`);
  return unwrap<Employee>(res.data);
}

export async function createEmployee(payload: EmployeePayload): Promise<Employee> {
  const res = await api.post('/employees', payload);
  return unwrap<Employee>(res.data);
}

export async function updateEmployee(id: string, payload: EmployeePayload): Promise<Employee> {
  const res = await api.patch(`/employees/${id}`, payload);
  return unwrap<Employee>(res.data);
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}
