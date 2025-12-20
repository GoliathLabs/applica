import { z } from 'zod'

export const AddApplication = z.object({
  id: z.coerce.number().optional(),

  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).nullish(),

  semester: z.coerce.number().nullish(),
  degree: z.string().max(50).nullish(),

  courseId: z.coerce.number(),
  fields: z.array(z.coerce.number()),
  customField: z.string().max(255).nullish(),

  experience: z.string().nullish(),

  messaged: z.boolean().optional(),
  talked: z.boolean().optional(),
  clubBriefed: z.boolean().optional(),
  securityBriefed: z.boolean().optional(),
  information: z.string().nullish(),
})