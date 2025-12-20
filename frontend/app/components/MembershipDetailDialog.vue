<script setup lang="ts">
import type { MembershipApplication } from '~/types/membershipApplication'

type Props = {
  application?: MembershipApplication | null
}

const { application } = withDefaults(defineProps<Props>(), {
  application: null,
})
const visible = defineModel<boolean>('visible')

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('de-DE')
}

function formatMembershipType(type: string): string {
  return type === 'regular' ? 'Reguläres Mitglied' : 'Fördermitglied'
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Ausstehend',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
  }
  return statusMap[status] || status
}

function getSeverity(status: string): string {
  const severityMapping: Record<string, string> = {
    pending: 'info',
    approved: 'success',
    rejected: 'danger',
  }
  return severityMapping[status] || 'info'
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    v-bind="$attrs"
    class="w-full max-w-[50rem] m-4"
    header="Mitgliedsantrag Details"
    modal
    close-on-escape
  >
    <div v-if="application" class="space-y-6">
      <!-- Status -->
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <span class="text-sm text-gray-600">Status</span>
          <div class="mt-1">
            <Tag
              :value="formatStatus(application.status)"
              :severity="getSeverity(application.status)"
            />
          </div>
        </div>
        <div class="text-right">
          <span class="text-sm text-gray-600">Antragsnummer</span>
          <div class="mt-1 font-semibold">#{{ application.id }}</div>
        </div>
      </div>

      <!-- Personal Information -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Persönliche Angaben</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-600">Vorname</span>
            <div class="font-medium">{{ application.firstName }}</div>
          </div>
          <div>
            <span class="text-sm text-gray-600">Nachname</span>
            <div class="font-medium">{{ application.lastName }}</div>
          </div>
          <div>
            <span class="text-sm text-gray-600">Geburtsdatum</span>
            <div class="font-medium">{{ formatDate(application.birthDate) }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Contact Information -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Kontaktdaten</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-600">E-Mail</span>
            <div class="font-medium">{{ application.email }}</div>
          </div>
          <div v-if="application.phone">
            <span class="text-sm text-gray-600">Telefon</span>
            <div class="font-medium">{{ application.phone }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Address -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Adresse</h3>
        <div class="grid grid-cols-1 gap-2">
          <div>
            <span class="text-sm text-gray-600">Straße</span>
            <div class="font-medium">{{ application.street }}</div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-gray-600">PLZ</span>
              <div class="font-medium">{{ application.postalCode }}</div>
            </div>
            <div>
              <span class="text-sm text-gray-600">Stadt</span>
              <div class="font-medium">{{ application.city }}</div>
            </div>
          </div>
          <div>
            <span class="text-sm text-gray-600">Land</span>
            <div class="font-medium">{{ application.country }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Bank Details -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Bankverbindung</h3>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <span class="text-sm text-gray-600">Kontoinhaber</span>
            <div class="font-medium">{{ application.accountHolder }}</div>
          </div>
          <div>
            <span class="text-sm text-gray-600">IBAN</span>
            <div class="font-medium font-mono">{{ application.iban }}</div>
          </div>
          <div v-if="application.bic">
            <span class="text-sm text-gray-600">BIC</span>
            <div class="font-medium font-mono">{{ application.bic }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Membership Type -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Mitgliedschaft</h3>
        <div>
          <span class="text-sm text-gray-600">Typ</span>
          <div class="font-medium">{{ formatMembershipType(application.membershipType) }}</div>
        </div>
      </div>

      <Divider />

      <!-- Digital Signature Info -->
      <div v-if="application.signatureTimestamp">
        <h3 class="text-lg font-semibold mb-3">Digitale Signatur</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-600">Zeitstempel</span>
            <div class="font-medium">{{ formatDateTime(application.signatureTimestamp) }}</div>
          </div>
          <div v-if="application.signatureIp">
            <span class="text-sm text-gray-600">IP-Adresse</span>
            <div class="font-medium font-mono">{{ application.signatureIp }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Admin Notes -->
      <div v-if="application.notes">
        <h3 class="text-lg font-semibold mb-3">Notizen</h3>
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="whitespace-pre-wrap">{{ application.notes }}</div>
        </div>
      </div>

      <!-- Timestamps -->
      <div class="text-sm text-gray-600">
        <div>Eingereicht am: {{ formatDateTime(application.createdAt) }}</div>
        <div>Zuletzt aktualisiert: {{ formatDateTime(application.updatedAt) }}</div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Schließen"
        icon="pi pi-times"
        @click="visible = false"
      />
    </template>
  </Dialog>
</template>
