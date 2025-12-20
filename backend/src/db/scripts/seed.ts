import { db } from '../db'
import { courses, fields, applications, applicationsFields } from '../schema'
import { logger } from '../../common/logger'

async function seedDatabase(): Promise<void> {
  try {
    logger.info('seeding database...')

    await db.transaction(async (tx) => {
      const insertedCourses = await tx
        .insert(courses)
        .values([
          { name: 'Computer Science' },
          { name: 'Mechanical Engineering' },
          { name: 'Business Administration' },
        ])
        .returning()

      const insertedFields = await tx
        .insert(fields)
        .values([
          { name: 'Unentschlossen' },
          { name: 'Software' },
          { name: 'Electric' },
          { name: 'Mechanic' },
          { name: 'Operations' },
        ])
        .returning()

      const insertedApplications = await tx
        .insert(applications)
        .values([
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            courseId: insertedCourses[0].id,
            semester: 2,
            degree: 'BSc',
            experience: 'Some experience in coding',
            status: 'pending',
            messaged: true,
            talked: false,
            clubBriefed: true,
            securityBriefed: false,
            information: 'John is interested in AI projects',
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '9876543210',
            courseId: insertedCourses[1].id,
            semester: 4,
            degree: 'MSc',
            experience: 'Experience in Robotics',
            status: 'accepted',
            messaged: true,
            talked: true,
            clubBriefed: true,
            securityBriefed: true,
            information: 'Jane is already part of the robotics team',
          },
        ])
        .returning()

      await tx.insert(applicationsFields).values([
        {
          applicationId: insertedApplications[0].id,
          fieldId: insertedFields[0].id,
        },
        {
          applicationId: insertedApplications[1].id,
          fieldId: insertedFields[0].id,
        },
        {
          applicationId: insertedApplications[1].id,
          fieldId: insertedFields[1].id,
        },
      ])
    })

    logger.info('seeding completed successfully')
  } catch (err) {
    logger.error('seeding failed', { err: String(err) })
    process.exit(1)
  }

  process.exit()
}

seedDatabase()
