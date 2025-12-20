import { z } from 'zod';
import { membershipApplications } from '../db';
import { createInsertSchema } from 'drizzle-zod';

const BaseSchema = createInsertSchema(membershipApplications, {
  email: (z) => z.string().email(),
  birthDate: (z) => z.string().date(),
});

const nameString = (): z.ZodEffects<z.ZodString, string, string> =>
  z
    .string()
    .min(1)
    .max(100)
    .transform((s) => s.trim());

const addressString = (): z.ZodEffects<z.ZodString, string, string> =>
  z
    .string()
    .min(1)
    .max(255)
    .transform((s) => s.trim());

const phoneSchema = z
  .string()
  .regex(/^\+?[0-9 \-()]{6,20}$/, 'Invalid phone format')
  .optional();

// IBAN validation - simplified regex for European IBANs
const ibanSchema = z
  .string()
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Invalid IBAN format')
  .transform((s) => s.replace(/\s/g, '').toUpperCase());

// BIC validation - optional but if provided must be valid
const bicSchema = z
  .string()
  .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid BIC format')
  .transform((s) => s.toUpperCase())
  .optional()
  .or(z.literal(''))
  .transform((s) => (s === '' ? undefined : s));

export const InsertMembershipApplication = BaseSchema.pick({
  firstName: true,
  lastName: true,
  birthDate: true,
  email: true,
  phone: true,
  street: true,
  postalCode: true,
  city: true,
  country: true,
  iban: true,
  bic: true,
  accountHolder: true,
  membershipType: true,
  signatureData: true,
  signatureTimestamp: true,
  signatureIp: true,
})
  .extend({
    firstName: nameString(),
    lastName: nameString(),
    email: z.string().email().max(255),
    phone: phoneSchema,
    street: addressString(),
    postalCode: z.string().min(1).max(20).transform((s) => s.trim()),
    city: z.string().min(1).max(100).transform((s) => s.trim()),
    country: z.string().min(1).max(100).transform((s) => s.trim()),
    iban: ibanSchema,
    bic: bicSchema,
    accountHolder: nameString(),
    membershipType: z.enum(['regular', 'supporting']),
    signatureData: z.string().optional(),
    signatureTimestamp: z.string().datetime().optional(),
    signatureIp: z.string().max(45).optional(),
  });

export const UpdateMembershipApplication = BaseSchema.partial()
  .pick({
    firstName: true,
    lastName: true,
    birthDate: true,
    email: true,
    phone: true,
    street: true,
    postalCode: true,
    city: true,
    country: true,
    iban: true,
    bic: true,
    accountHolder: true,
    membershipType: true,
    notes: true,
  })
  .extend({
    id: z.number().int().positive(),
    firstName: nameString().optional(),
    lastName: nameString().optional(),
    email: z.string().email().max(255).optional(),
    phone: phoneSchema,
    street: addressString().optional(),
    postalCode: z.string().min(1).max(20).transform((s) => s.trim()).optional(),
    city: z.string().min(1).max(100).transform((s) => s.trim()).optional(),
    country: z.string().min(1).max(100).transform((s) => s.trim()).optional(),
    iban: ibanSchema.optional(),
    bic: bicSchema,
    accountHolder: nameString().optional(),
    membershipType: z.enum(['regular', 'supporting']).optional(),
    notes: z.string().max(2000).optional(),
  });

export const UpdateMembershipApplicationStatus = BaseSchema.pick({
  status: true,
}).extend({
  id: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
});

export const DeleteMembershipApplication = z.object({
  id: z.number().int().positive(),
});

export type MembershipApplicationWithDetails = typeof membershipApplications.$inferSelect;
