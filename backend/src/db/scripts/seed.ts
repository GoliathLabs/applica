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
          // Bachelor Programs
          { name: 'Informatik (B.Sc.)' },
          { name: 'Wirtschaftsinformatik (B.Sc.)' },
          { name: 'Interaktive Medien (B.A.)' },
          { name: 'Maschinenbau (B.Eng.)' },
          { name: 'Mechatronik (B.Eng.)' },
          { name: 'Elektrotechnik (B.Eng.)' },
          { name: 'Wirtschaftsingenieurwesen (B.Eng.)' },
          { name: 'Bauingenieurwesen (B.Eng.)' },
          { name: 'Architektur (B.A.)' },
          { name: 'Betriebswirtschaft (B.A.)' },
          { name: 'Internationale Betriebswirtschaft (B.A.)' },
          { name: 'Wirtschaftsrecht (LL.B.)' },
          { name: 'Umwelt- und Verfahrenstechnik (B.Eng.)' },
          { name: 'Energieeffizientes Planen und Bauen (B.Eng.)' },
          { name: 'Biomedizinische Technik (B.Eng.)' },
          { name: 'Leichtbau und Simulation (B.Eng.)' },
          { name: 'Data Science (B.Sc.)' },
          
          // Master Programs
          { name: 'Informatik (M.Sc.)' },
          { name: 'Interaktive Mediensysteme (M.A.)' },
          { name: 'Maschinenbau (M.Eng.)' },
          { name: 'Wirtschaftsingenieurwesen (M.Eng.)' },
          { name: 'Elektrotechnik (M.Eng.)' },
          { name: 'Architektur (M.A.)' },
          { name: 'Bauingenieurwesen (M.Eng.)' },
          { name: 'Technologie-Management (MBA)' },
          { name: 'Leichtbau und Faserverbundtechnologie (M.Eng.)' },
          { name: 'Umwelt- und Verfahrenstechnik (M.Eng.)' },
          { name: 'Systems Engineering (M.Eng.)' },
          
          // Specialized Programs
          { name: 'Startfenster' },
          { name: 'Startklar' },
        ])
        .returning()

      const insertedFields = await tx
        .insert(fields)
        .values([
          { name: 'Driverless' },
          { name: 'Robotics' },
          { name: 'Marketing' },
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
