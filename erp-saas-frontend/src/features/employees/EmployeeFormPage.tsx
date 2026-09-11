import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { EmployeeForm } from '@/features/employees/EmployeeForm';
import { createEmployee, updateEmployee, fetchEmployee } from '@/services/employees.service';
import { employeeFullName } from '@/types/employee.types';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';

export function EmployeeFormPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/hr/employees');

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => fetchEmployee(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'employees',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createEmployee>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'employees',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createEmployee,
      update: updateEmployee,
      queryClient,
      listQueryKey: ['employees'],
      navigate: () => navigateAfterSave(),
    });
  };

  return (
    <FormLayoutEditorProvider entityId="employees">
      {dialog}
      <EntityRecordLayout
        width="comfortable"
        header={(
          <EntityRecordHeader
            backLabel="Volver a empleados"
            onBack={leave}
            actions={<FormLayoutEditToggle />}
          />
        )}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo empleado' : `Editar: ${employee ? employeeFullName(employee) : '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <EmployeeForm
              key={`${employee?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              employee={employee}
              customFieldValues={customFieldValues}
              embedded
              onDirtyChange={setFormDirty}
              onCancel={leave}
              onSubmit={handleSubmit}
            />
          )}
        </Card>
      </EntityRecordLayout>
    </FormLayoutEditorProvider>
  );
}
