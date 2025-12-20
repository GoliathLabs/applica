import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  varchar,
  timestamp,
  primaryKey,
  text,
  date,
} from 'drizzle-orm/pg-core'

// `courses` table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const coursesRelations = relations(courses, ({ many }) => ({
  applications: many(applications),
}))

// `fields` table
export const fields = pgTable('fields', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const fieldsRelations = relations(fields, ({ many }) => ({
  applications: many(applicationsFields),
}))

// `applications` table
export const applicationStatus = pgEnum('applicationstatus', [
  'pending',
  'accepted',
  'declined',
])

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id),
  semester: integer('semester'),
  degree: varchar('degree', { length: 50 }),
  experience: varchar('experience'),
  status: applicationStatus('status').notNull().default('pending'),
  messaged: boolean('messaged').default(false),
  talked: boolean('talked').default(false),
  clubBriefed: boolean('club_briefed').default(false),
  securityBriefed: boolean('security_briefed').default(false),
  information: varchar('information'),
  created: timestamp('created').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [applications.courseId],
      references: [courses.id],
    }),
    fields: many(applicationsFields),
  })
)

// `applications_fields` table
export const applicationsFields = pgTable(
  'applications_fields',
  {
    applicationId: integer('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fieldId: integer('field_id')
      .notNull()
      .references(() => fields.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.applicationId, t.fieldId] }),
  })
)

export const applicatoinsFieldsRelations = relations(
  applicationsFields,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationsFields.applicationId],
      references: [applications.id],
    }),
    field: one(fields, {
      fields: [applicationsFields.fieldId],
      references: [fields.id],
    }),
  })
)

// `membership_applications` table
export const membershipStatus = pgEnum('membershipstatus', [
  'pending',
  'approved',
  'rejected',
])

export const membershipType = pgEnum('membershiptype', [
  'regular',
  'supporting',
])

export const membershipApplications = pgTable('membership_applications', {
  id: serial('id').primaryKey(),
  // Personal information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  birthDate: date('birth_date').notNull(),
  // Contact information
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  // Address
  street: varchar('street', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  // Bank details for membership fee
  iban: varchar('iban', { length: 34 }).notNull(),
  bic: varchar('bic', { length: 11 }),
  accountHolder: varchar('account_holder', { length: 255 }).notNull(),
  // Membership details
  membershipType: membershipType('membership_type').notNull().default('regular'),
  // Digital signature
  signatureData: text('signature_data'), // Base64 encoded signature image
  signatureTimestamp: timestamp('signature_timestamp'),
  signatureIp: varchar('signature_ip', { length: 45 }), // IPv4 or IPv6
  // Status and metadata
  status: membershipStatus('status').notNull().default('pending'),
  notes: text('notes'), // Admin notes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
