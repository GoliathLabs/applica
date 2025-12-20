import type {
  MembershipApplication,
  MembershipStatus,
  DeleteMembershipApplicationResponse,
  UpdateMembershipApplicationStatusResponse,
  AddMembershipApplicationResponse,
  UpdateMembershipApplicationResponse,
} from '~/types/membershipApplication'
import type { z } from 'zod'
import type { AddMembershipApplication } from '~/types/membershipApplication.schema'

export const useMembershipApplicationsStore = defineStore('membershipApplications', () => {
  const $membershipApplications = ref<MembershipApplication[]>([])

  async function fetchMembershipApplications(): Promise<void> {
    const data = await useNuxtApp().$api<MembershipApplication[]>('/membership-applications')
    $membershipApplications.value = data
  }

  async function deleteMembershipApplication(application: MembershipApplication): Promise<void> {
    const data = await useNuxtApp().$api<DeleteMembershipApplicationResponse>(
      '/membership-applications',
      {
        method: 'DELETE',
        body: {
          id: application.id,
        },
      }
    )

    $membershipApplications.value = $membershipApplications.value.filter(
      (app) => app.id !== data.id
    )
  }

  async function setMembershipApplicationStatus(
    application: MembershipApplication,
    status: MembershipStatus,
    notes?: string
  ): Promise<void> {
    const data = await useNuxtApp().$api<UpdateMembershipApplicationStatusResponse>(
      '/membership-applications/status',
      {
        method: 'POST',
        body: {
          id: application.id,
          status,
          notes,
        },
      }
    )

    const target = $membershipApplications.value.findIndex((a) => a.id === data.id)
    if (target !== -1) {
      $membershipApplications.value[target]!.status = data.status
    }
  }

  async function addMembershipApplication(
    application: z.infer<typeof AddMembershipApplication>
  ): Promise<MembershipApplication> {
    const data = await useNuxtApp().$api<AddMembershipApplicationResponse>(
      '/membership-applications',
      {
        method: 'POST',
        body: application,
      }
    )

    return data
  }

  async function updateMembershipApplication(
    application: z.infer<typeof AddMembershipApplication>
  ): Promise<void> {
    const data = await useNuxtApp().$api<UpdateMembershipApplicationResponse>(
      '/membership-applications',
      {
        method: 'PUT',
        body: application,
      }
    )

    const target = $membershipApplications.value.findIndex((a) => a.id === data.id)
    if (target !== -1) {
      $membershipApplications.value[target] = data
    }
  }

  return {
    membershipApplications: $membershipApplications,
    fetchMembershipApplications,
    deleteMembershipApplication,
    setMembershipApplicationStatus,
    addMembershipApplication,
    updateMembershipApplication,
  }
})
