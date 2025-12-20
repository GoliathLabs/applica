import { z } from 'zod';
import { applications, applicationsFields } from '../db';
import { createInsertSchema } from 'drizzle-zod';

const BaseSchema = createInsertSchema(applications);

const nameString = () =>
  z
    .string()
    .min(1)
    .max(100)
    .transform((s) => s.trim());

const optionalString = (max = 255) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim())
    .optional();

const phoneSchema = z
  .string()
  .regex(/^\+?[0-9 \-()]{6,20}$/, 'Invalid phone format')
  .optional();

export const InsertApplication = BaseSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  courseId: true,
  semester: true,
  degree: true,
  experience: true,
})
  .extend({
    firstName: nameString(),
    lastName: nameString(),
    email: z.string().email().max(255),
    phone: phoneSchema,
    degree: optionalString(50),
    experience: optionalString(2000),
    fields: z
      .array(z.number().int().positive())
      .min(1)
      .max(10),
  });

export const UpdateApplication = BaseSchema.partial()
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    courseId: true,
    semester: true,
    degree: true,
    experience: true,
    messaged: true,
    talked: true,
    clubBriefed: true,
    securityBriefed: true,
    information: true,
  })
  .extend({
    id: z.number().int().positive(),
    firstName: nameString().optional(),
    lastName: nameString().optional(),
    email: z.string().email().max(255).optional(),
    phone: phoneSchema,
    degree: optionalString(50),
    experience: optionalString(2000),
    fields: z
      .array(z.number().int().positive())
      .min(0)
      .max(10)
      .optional(),
  });

export const UpdateApplicationStatus = BaseSchema.pick({
  status: true,
}).extend({
  id: z.number().int().positive(),
});

export const DeleteApplication = z.object({
  id: z.number().int().positive(),
});

export type RawApplicationWithFields = Partial<
  typeof applications.$inferSelect & {
    fields: (typeof applicationsFields.$inferSelect)[];
  }
>;