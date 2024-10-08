import { z } from 'zod'

export const AddApplication = z.object({
  id: z.number().optional(),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).nullish(),
  semester: z.number().nullish(),
  degree: z.string().max(50).nullish(),
  courseId: z.number(),
  fields: z.array(z.number()),
  experience: z.string().nullish(),
  messaged: z.boolean().optional(),
  talked: z.boolean().optional(),
  clubBriefed: z.boolean().optional(),
  securityBriefed: z.boolean().optional(),
  information: z.string().nullish(),
})
