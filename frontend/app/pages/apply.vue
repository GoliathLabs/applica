<script setup lang="ts">
import { AddMembershipApplication } from '~/types/membershipApplication.schema'

// This is a public page - no authentication required
definePageMeta({
  layout: false,
})

const membershipStore = useMembershipApplicationsStore()
const toast = useToast()
const router = useRouter()

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(AddMembershipApplication),
  initialValues: {
    membershipType: 'regular',
    country: 'Deutschland',
  }
})

const submitted = ref(false)
const applicationId = ref<number | null>(null)

const onSubmit = handleSubmit(async (values) => {
  try {
    const result = await membershipStore.addMembershipApplication(values)
    
    applicationId.value = result.id
    submitted.value = true
    
    toast.add({
      severity: 'success',
      summary: 'Erfolg',
      detail: 'Ihr Mitgliedsantrag wurde erfolgreich eingereicht!',
      life: 5000,
    })

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Fehler',
      detail: 'Der Antrag konnte nicht eingereicht werden. Bitte versuchen Sie es später erneut.',
      life: 5000,
    })
  }
})

const startNewApplication = (): void => {
  submitted.value = false
  applicationId.value = null
  resetForm()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <Card>
        <template #header>
          <div class="p-6 bg-primary-500 text-white">
            <h1 class="text-3xl font-bold mb-2">Digitaler Mitgliedsantrag</h1>
            <p class="text-primary-100">
              Werden Sie Mitglied in unserem Verein
            </p>
          </div>
        </template>

        <template #content>
          <!-- Success Message -->
          <div v-if="submitted" class="space-y-6">
            <Message severity="success" :closable="false">
              <div class="flex items-start gap-3">
                <i class="pi pi-check-circle text-2xl" />
                <div>
                  <h3 class="font-semibold text-lg mb-2">
                    Vielen Dank für Ihren Mitgliedsantrag!
                  </h3>
                  <p class="mb-2">
                    Ihr Antrag wurde erfolgreich eingereicht und wird zeitnah von unserem Team geprüft.
                  </p>
                  <p class="text-sm">
                    Sie erhalten in Kürze eine Bestätigungs-E-Mail mit weiteren Informationen.
                  </p>
                  <p class="text-sm mt-2">
                    <strong>Antragsnummer:</strong> {{ applicationId }}
                  </p>
                </div>
              </div>
            </Message>

            <div class="flex gap-3">
              <Button
                label="Weiteren Antrag stellen"
                icon="pi pi-plus"
                @click="startNewApplication"
              />
              <Button
                label="Zur Startseite"
                icon="pi pi-home"
                severity="secondary"
                outlined
                @click="router.push('/')"
              />
            </div>
          </div>

          <!-- Application Form -->
          <form v-else class="space-y-6" @submit="onSubmit">
            <!-- Personal Information -->
            <fieldset class="border border-gray-200 rounded-lg p-6">
              <legend class="text-xl font-semibold px-2">Persönliche Angaben</legend>
              
              <div class="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
                <FormInputText name="firstName" label="Vorname *" />
                <FormInputText name="lastName" label="Nachname *" />
                <FormInputText 
                  name="birthDate" 
                  label="Geburtsdatum *" 
                  type="date"
                  class="md:col-span-2"
                />
              </div>
            </fieldset>

            <!-- Contact Information -->
            <fieldset class="border border-gray-200 rounded-lg p-6">
              <legend class="text-xl font-semibold px-2">Kontaktdaten</legend>
              
              <div class="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
                <FormInputText name="email" label="E-Mail-Adresse *" type="email" />
                <FormInputText name="phone" label="Telefonnummer" />
              </div>
            </fieldset>

            <!-- Address -->
            <fieldset class="border border-gray-200 rounded-lg p-6">
              <legend class="text-xl font-semibold px-2">Adresse</legend>
              
              <div class="grid gap-4 grid-cols-1 mt-4">
                <FormInputText name="street" label="Straße und Hausnummer *" />
                
                <div class="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <FormInputText name="postalCode" label="Postleitzahl *" />
                  <FormInputText name="city" label="Stadt *" class="md:col-span-2" />
                </div>
                
                <FormInputText name="country" label="Land *" />
              </div>
            </fieldset>

            <!-- Bank Details -->
            <fieldset class="border border-gray-200 rounded-lg p-6">
              <legend class="text-xl font-semibold px-2">Bankverbindung</legend>
              
              <Message severity="info" :closable="false" class="mt-4 mb-4">
                Für den Einzug des Mitgliedsbeitrags benötigen wir Ihre Bankverbindung.
                Ihre Daten werden verschlüsselt und DSGVO-konform gespeichert.
              </Message>
              
              <div class="grid gap-4 grid-cols-1 mt-4">
                <FormInputText name="accountHolder" label="Kontoinhaber *" />
                <FormInputText 
                  name="iban" 
                  label="IBAN *" 
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
                <FormInputText 
                  name="bic" 
                  label="BIC (optional)" 
                  placeholder="COBADEFFXXX"
                />
              </div>
            </fieldset>

            <!-- Membership Type -->
            <fieldset class="border border-gray-200 rounded-lg p-6">
              <legend class="text-xl font-semibold px-2">Mitgliedschaft</legend>
              
              <div class="mt-4">
                <FormSelect
                  name="membershipType"
                  label="Mitgliedschaftstyp *"
                  :options="[
                    { label: 'Reguläres Mitglied', value: 'regular' },
                    { label: 'Fördermitglied', value: 'supporting' },
                  ]"
                  option-label="label"
                  option-value="value"
                />
              </div>
            </fieldset>

            <!-- Legal Notice -->
            <fieldset class="border border-gray-200 rounded-lg p-6">
              <legend class="text-xl font-semibold px-2">Rechtliche Hinweise</legend>
              
              <div class="mt-4 space-y-4">
                <Message severity="info" :closable="false">
                  <div class="text-sm space-y-2">
                    <p>
                      Mit der Einreichung dieses Antrags bestätige ich, dass die angegebenen 
                      Informationen korrekt sind und ich die Satzung des Vereins akzeptiere.
                    </p>
                    <p>
                      Die Verarbeitung Ihrer personenbezogenen Daten erfolgt gemäß der 
                      Datenschutz-Grundverordnung (DSGVO). Weitere Informationen finden Sie 
                      in unserer Datenschutzerklärung.
                    </p>
                  </div>
                </Message>
              </div>
            </fieldset>

            <!-- Submit Button -->
            <div class="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                label="Abbrechen"
                icon="pi pi-times"
                severity="secondary"
                outlined
                @click="router.push('/')"
              />
              <Button
                type="submit"
                label="Antrag einreichen"
                :icon="isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                :disabled="isSubmitting"
              />
            </div>

            <p class="text-sm text-gray-600 text-center">
              * Pflichtfelder
            </p>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
fieldset {
  min-width: 0;
}

legend {
  float: left;
  width: auto;
  margin: 0;
}

fieldset::after {
  content: '';
  display: table;
  clear: both;
}
</style>
