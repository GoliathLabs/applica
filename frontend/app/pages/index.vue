<script setup lang="ts">
import type DataTable from 'primevue/datatable';
import type {
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from 'primevue/datatable';
import type { Application, ApplicationStatus, Field } from '~/types/applicaion';

definePageMeta({
  middleware: ['authorized'],
});

const applicationsStore = useApplicationsStore();
await useAsyncData('applications', () =>
  applicationsStore.fetchApplications().then(() => true)
);

const confirm = useConfirm();
const toast = useToast();

const dataTable = useTemplateRef<InstanceType<typeof DataTable>>('data-table');
const selected = ref<Application[]>([]);
const detail = ref<Application | null>(null);

const detailDialog = ref(false);
const statusOptions = ['pending', 'accepted', 'declined'];
const filters = ref<DataTableFilterMeta>({
  global: { value: '', matchMode: 'contains' },
  status: { value: '', matchMode: 'equals' },
});

function getFilterData(name: string): DataTableFilterMetaData {
  return filters.value[name] as DataTableFilterMetaData;
}

function getSeverity(status: ApplicationStatus): string {
  const severityMapping = {
    pending: 'info',
    accepted: 'success',
    declined: 'danger',
  };
  return severityMapping[status];
}

function formatFields(fields: Field[]): string {
  return fields.map((field) => field.name).join(', ');
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function confirmStatusChange(application: Application, status: ApplicationStatus): void {
  confirm.require({
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    message: `Are you sure you want to ${status === 'accepted' ? 'accept' : 'decline'} the application of ${application.firstName} ${application.lastName}`,
    rejectProps: {
      severity: 'secondary',
      outlined: true,
    },
    accept: async () => {
      await applicationsStore.setApplicationStatus(application, status);
      toast.add({
        severity: 'success',
        summary: 'Status changed',
        detail: `You have ${status === 'accepted' ? 'accepted' : 'declined'} the application`,
        life: 3000,
      });
    },
  });
}

function confirmDelete(): void {
  const count = selected.value.length;
  confirm.require({
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    message: `Are you sure you want to delete all ${count} selected applications`,
    rejectProps: {
      severity: 'secondary',
      outlined: true,
    },
    accept: async () => {
      const deleteRequests = selected.value.map((application) =>
        applicationsStore.deleteApplication(application)
      );

      await Promise.all(deleteRequests);

      toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `You have deleted the applications`,
        life: 3000,
      });
    },
  });
}

function openDetailDialog(application?: Application): void {
  detail.value = application || null;
  detailDialog.value = true;
}

function closeDetailDialog(): void {
  detail.value = null;
}
</script>

<template>
  <div>
    <ConfirmDialog />
    <ApplicationDetailDialog
      v-model:visible="detailDialog"
      :application="detail"
      @hide="closeDetailDialog"
    />

    <Card class="m4">
      <template #content>
        <Toolbar class="!p4">
          <template #start>
            <Button
              label="New"
              icon="pi pi-plus"
              class="mr-4"
              @click="openDetailDialog()"
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              severity="danger"
              outlined
              :disabled="!selected.length"
              @click="confirmDelete"
            />
          </template>
          <template #end>
            <div class="hidden md:block">
              <Button
                label="Export"
                icon="pi pi-upload"
                severity="secondary"
                @click="dataTable?.exportCSV()"
              />
            </div>
          </template>
        </Toolbar>

        <DataTable
          ref="data-table"
          v-model:filters="filters"
          v-model:selection="selected"
          filter-display="menu"
          removable-sort
          sort-mode="multiple"
          paginator
          :value="applicationsStore.applications"
          :rows="15"
          :rows-per-page-options="[5, 15, 25]"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xl font-bold">Applications</span>
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="getFilterData('global').value"
                  placeholder="Search"
                />
              </IconField>
            </div>
          </template>

          <template #empty>No applications found.</template>

          <Column selection-mode="multiple" />
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getSeverity(data.status)" />
            </template>
            <template #filter="{ filterModel }">
              <Select
                v-model="filterModel.value"
                placeholder="Select one"
                :options="statusOptions"
              >
                <template #option="slotProps">
                  <Tag
                    :value="slotProps.option"
                    :severity="getSeverity(slotProps.option)"
                  />
                </template>
              </Select>
            </template>
          </Column>
          <Column field="firstName" header="First name" sortable />
          <Column field="lastName" header="Last name" sortable />
          <Column field="course.name" header="Course" sortable />
          <Column field="semester" header="Semester" sortable />
          <Column field="degree" header="Degree" sortable />
          <Column field="fields" header="Fields" sortable>
            <template #body="slotProps">
              {{ formatFields(slotProps.data.fields) }}
            </template>
          </Column>
          <Column field="created" header="Created" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.created) }}
            </template>
          </Column>
          <Column :exportable="false">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pen-to-square"
                  severity="secondary"
                  text
                  @click="openDetailDialog(slotProps.data)"
                />
                <Button
                  icon="pi pi-check"
                  outlined
                  severity="success"
                  :disabled="slotProps.data.status !== 'pending'"
                  @click="confirmStatusChange(slotProps.data, 'accepted')"
                />
                <Button
                  icon="pi pi-times"
                  outlined
                  severity="danger"
                  :disabled="slotProps.data.status !== 'pending'"
                  @click="confirmStatusChange(slotProps.data, 'declined')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>