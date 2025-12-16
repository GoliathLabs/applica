import type {
  Field,
  Application,
  ApplicationStatus,
  Course,
  DeleteApplicationResponse,
  UpdateApplicationStatusResponse,
  AddApplicationResponse,
  RawApplicationWithFields,
  UpdateApplicationResponse,
} from '~/types/applicaion'
import type { z } from 'zod'
import type { AddApplication } from '~/types/applicaion.schema'

export const useApplicationsStore = defineStore('applications', () => {
  const $applications = ref<Application[]>([])
  const $fields = ref<Field[]>([])
  const $courses = ref<Course[]>([])

  async function fetchApplications(): Promise<void> {
    const data = await useNuxtApp().$api<Application[]>('/applications')
    $applications.value = data
  }

  async function fetchFieldsAndCourses(): Promise<void> {
    const data = await Promise.all([
      useNuxtApp().$api<Course[]>('/courses'),
      useNuxtApp().$api<Field[]>('/fields'),
    ])

    $courses.value = data[0]
    $fields.value = data[1]
  }

  async function deleteApplication(application: Application): Promise<void> {
    const data = await useNuxtApp().$api<DeleteApplicationResponse>(
      '/applications',
      {
        method: 'DELETE',
        body: {
          id: application.id,
        },
      }
    )

    $applications.value = $applications.value.filter(
      (appl) => appl.id !== data.id
    )
  }

  async function setApplicationStatus(
    application: Application,
    status: ApplicationStatus
  ): Promise<void> {
    const data = await useNuxtApp().$api<UpdateApplicationStatusResponse>(
      '/applications/status',
      {
        method: 'POST',
        body: {
          id: application.id,
          status,
        },
      }
    )

    const target = $applications.value.findIndex((a) => a.id === data.id)
    if (target !== -1) {
      $applications.value[target]!.status = data.status
    }
  }

  async function addApplication(
    application: z.infer<typeof AddApplication>
  ): Promise<void> {
    const data = await useNuxtApp().$api<AddApplicationResponse>(
      '/applications',
      {
        method: 'POST',
        body: application,
      }
    )

    $applications.value.push(transformRawApplicationWithFields(data))
  }

  async function updateApplication(
    application: z.infer<typeof AddApplication>
  ): Promise<void> {
    const data = await useNuxtApp().$api<UpdateApplicationResponse>(
      '/applications',
      {
        method: 'PUT',
        body: application,
      }
    )

    const target = $applications.value.findIndex((a) => a.id === data.id)
    if (target !== -1) {
      $applications.value[target] = transformRawApplicationWithFields(data)
    }
  }

  function transformRawApplicationWithFields(
    data: RawApplicationWithFields
  ): Application {
    const { fields, courseId } = data

    return {
      ...data,
      course:
        $courses.value.find((course) => course.id === courseId) ??
        ({ id: courseId, name: '—' } as Course),

      fields: fields
        .map((fieldRelation) =>
          $fields.value.find((field) => field.id === fieldRelation.fieldId)
        )
        .filter(Boolean) as Field[],
    }
  }


  return {
    applications: $applications,
    fields: $fields,
    courses: $courses,
    fetchApplications,
    fetchFieldsAndCourses,
    deleteApplication,
    setApplicationStatus,
    addApplication,
    updateApplication,
  }
})
