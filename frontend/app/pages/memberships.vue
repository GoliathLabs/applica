<script setup lang="ts">
import type DataTable from 'primevue/datatable';
import type {
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from 'primevue/datatable';
import type { MembershipApplication, MembershipStatus } from '~/types/membershipApplication';

definePageMeta({
  middleware: ['authorized'],
});

const membershipStore = useMembershipApplicationsStore();
await useAsyncData('membershipApplications', () =>
  membershipStore.fetchMembershipApplications()
);

const confirm = useConfirm();
const toast = useToast();

const dataTable = useTemplateRef<InstanceType<typeof DataTable>>('data-table');
const selected = ref<MembershipApplication[]>([]);
const detail = ref<MembershipApplication | null>(null);

const detailDialog = ref(false);
const statusOptions = ['pending', 'approved', 'rejected'];
const filters = ref<DataTableFilterMeta>({
  global: { value: '', matchMode: 'contains' },
  status: { value: '', matchMode: 'equals' },
});

function getFilterData(name: string): DataTableFilterMetaData {
  return filters.value[name] as DataTableFilterMetaData;
}

function getSeverity(status: MembershipStatus): string {
  const severityMapping = {
    pending: 'info',
    approved: 'success',
    rejected: 'danger',
  };
  return severityMapping[status];
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('de-DE');
}

function formatMembershipType(type: string): string {
  return type === 'regular' ? 'Regulär' : 'Fördernd';
}

function confirmStatusChange(application: MembershipApplication, status: MembershipStatus): void {
  confirm.require({
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    message: `Möchten Sie den Antrag von ${application.firstName} ${application.lastName} wirklich ${status === 'approved' ? 'genehmigen' : 'ablehnen'}?`,
    rejectProps: {
      severity: 'secondary',
      outlined: true,
      label: 'Abbrechen',
    },
    acceptProps: {
      label: 'Bestätigen',
    },
    accept: async () => {
      await membershipStore.setMembershipApplicationStatus(application, status);
      toast.add({
        severity: 'success',
        summary: 'Status geändert',
        detail: `Der Antrag wurde ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}`,
        life: 3000,
      });
    },
  });
}

function confirmDelete(): void {
  const count = selected.value.length;
  confirm.require({
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    message: `Möchten Sie wirklich ${count} ${count === 1 ? 'Antrag' : 'Anträge'} löschen?`,
    rejectProps: {
      severity: 'secondary',
      outlined: true,
      label: 'Abbrechen',
    },
    acceptProps: {
      label: 'Löschen',
      severity: 'danger',
    },
    accept: async () => {
      const deleteRequests = selected.value.map((application) =>
        membershipStore.deleteMembershipApplication(application)
      );

      await Promise.all(deleteRequests);

      toast.add({
        severity: 'success',
        summary: 'Gelöscht',
        detail: `${count} ${count === 1 ? 'Antrag wurde' : 'Anträge wurden'} gelöscht`,
        life: 3000,
      });
      
      selected.value = [];
    },
  });
}

function openDetailDialog(application?: MembershipApplication): void {
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
    <MembershipDetailDialog
      v-model:visible="detailDialog"
      :application="detail"
      @hide="closeDetailDialog"
    />

    <Card class="m4">
      <template #content>
        <Toolbar class="!p4">
          <template #start>
            <Button
              label="Details"
              icon="pi pi-eye"
              class="mr-4"
              severity="secondary"
              outlined
              :disabled="selected.length !== 1"
              @click="openDetailDialog(selected[0])"
            />
            <Button
              label="Löschen"
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
          :value="membershipStore.membershipApplications"
          :rows="15"
          :rows-per-page-options="[5, 15, 25]"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xl font-bold">Mitgliedsanträge</span>
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="getFilterData('global').value"
                  placeholder="Suchen"
                />
              </IconField>
            </div>
          </template>

          <template #empty>Keine Mitgliedsanträge gefunden.</template>

          <Column selection-mode="multiple" />
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getSeverity(data.status)" />
            </template>
            <template #filter="{ filterModel }">
              <Select
                v-model="filterModel.value"
                placeholder="Auswählen"
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
          <Column field="firstName" header="Vorname" sortable />
          <Column field="lastName" header="Nachname" sortable />
          <Column field="email" header="E-Mail" sortable />
          <Column field="city" header="Stadt" sortable />
          <Column field="membershipType" header="Typ" sortable>
            <template #body="slotProps">
              {{ formatMembershipType(slotProps.data.membershipType) }}
            </template>
          </Column>
          <Column field="createdAt" header="Eingereicht am" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column :exportable="false">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  @click="openDetailDialog(slotProps.data)"
                />
                <Button
                  icon="pi pi-check"
                  outlined
                  severity="success"
                  :disabled="slotProps.data.status !== 'pending'"
                  @click="confirmStatusChange(slotProps.data, 'approved')"
                />
                <Button
                  icon="pi pi-times"
                  outlined
                  severity="danger"
                  :disabled="slotProps.data.status !== 'pending'"
                  @click="confirmStatusChange(slotProps.data, 'rejected')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>
