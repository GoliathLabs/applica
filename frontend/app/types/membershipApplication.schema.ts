import { z } from 'zod'

// IBAN validation helper - simplified regex for European IBANs
const ibanSchema = z
  .string()
  .min(15)
  .max(34)
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Invalid IBAN format')
  .transform((s) => s.replace(/\s/g, '').toUpperCase())

// BIC validation - optional but if provided must be valid
const bicSchema = z
  .string()
  .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid BIC format')
  .transform((s) => s.toUpperCase())
  .optional()
  .or(z.literal(''))
  .transform((s) => (s === '' ? undefined : s))

export const AddMembershipApplication = z.object({
  id: z.coerce.number().optional(),

  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthDate: z.string().date(),
  
  email: z.string().email().max(255),
  phone: z.string().max(50).nullish(),

  street: z.string().min(1).max(255),
  postalCode: z.string().min(1).max(20),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),

  iban: ibanSchema,
  bic: bicSchema,
  accountHolder: z.string().min(1).max(255),

  membershipType: z.enum(['regular', 'supporting']),

  signatureData: z.string().nullish(),
  signatureTimestamp: z.string().datetime().nullish(),

  notes: z.string().max(2000).nullish(),
})
