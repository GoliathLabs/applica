import { Hono } from 'hono'
import { applications, applicationsFields, db } from '../db'
import { zValidator } from '@hono/zod-validator'
import {
  DeleteApplication,
  InsertApplication,
  UpdateApplicationStatus,
  UpdateApplication,
  type RawApplicationWithFields,
} from '../models/application'
import { eq } from 'drizzle-orm'
import { jwt } from 'hono/jwt'
import { env } from 'hono/adapter'
import { getLdapClient, ldapConfig } from '../ldap'
import { randomNumber, randomPassword } from '../common/util'
import { createHash } from 'crypto'
import { AlreadyExistsError } from 'ldapts'
import { HTTPException } from 'hono/http-exception'
import { StatusCodes } from 'http-status-codes'
import { sendEmail } from '../services/emailService';

export const app = new Hono().basePath('/applications')

app.post('/', zValidator('json', InsertApplication), async (c) => {
  const req = c.req.valid('json')

  const dbResult = await db.transaction(
    async (tx): Promise<RawApplicationWithFields> => {
      // Insert application
      const [newApplication] = await tx
        .insert(applications)
        .values(req)
        .returning()

      // Insert application fields
      const newFields = await tx
        .insert(applicationsFields)
        .values(
          req.fields.map((fieldId) => ({
            applicationId: newApplication.id,
            fieldId,
          }))
        )
        .returning()

      return {
        ...newApplication,
        fields: newFields,
      }
    }
  )

  return c.json(dbResult)
})

app.use('*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: env<{ JWT_SECRET: string }>(c).JWT_SECRET,
  })

  return jwtMiddleware(c, next)
})

app.get('/', async (c) => {
  const dbResult = await db.query.applications.findMany({
    columns: {
      courseId: false,
    },
    with: {
      course: true,
      fields: {
        columns: {},
        with: {
          field: true,
        },
      },
    },
  })

  const flattenedResult = dbResult.map((application) => ({
    ...application,
    fields: application.fields.map((field) => field.field),
  }))

  return c.json(flattenedResult)
})

app.put('/', zValidator('json', UpdateApplication), async (c) => {
  const req = c.req.valid('json')

  const dbResult = await db.transaction(
    async (tx): Promise<RawApplicationWithFields> => {
      // Try to update the specified application
      const updatedApplication = await tx
        .update(applications)
        .set(req)
        .where(eq(applications.id, req.id))
        .returning()

      // If the application has been updated
      let res: RawApplicationWithFields = {}
      if (updatedApplication.length > 0) {
        res = updatedApplication[0]

        // Delete all fields associated with this application
        await tx
          .delete(applicationsFields)
          .where(eq(applicationsFields.applicationId, req.id))

        // Create new field entries according to the updated information
        res.fields = []
        if (req.fields.length > 0) {
          const updatedFields = await tx
            .insert(applicationsFields)
            .values(
              req.fields.map((fieldId) => ({
                applicationId: req.id,
                fieldId,
              }))
            )
            .returning()

          res.fields = updatedFields
        }
      }

      return res
    }
  )

  return c.json(dbResult)
})

app.delete('/', zValidator('json', DeleteApplication), async (c) => {
  const req = c.req.valid('json')

  const [dbResult] = await db
    .delete(applications)
    .where(eq(applications.id, req.id))
    .returning({ id: applications.id })

  return c.json(dbResult)
})

app.post('/status', zValidator('json', UpdateApplicationStatus), async (c) => {
  const req = c.req.valid('json')

  // Get information about the application
  const rawApplication = await db.query.applications.findFirst({
    where: eq(applications.id, req.id),
    with: {
      fields: {
        columns: {},
        with: {
          field: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!rawApplication) {
    throw new HTTPException(StatusCodes.BAD_REQUEST, {
      message: 'Invalid application',
    })
  }

  const application = {
    ...rawApplication,
    fields: rawApplication.fields.map((f) => f.field.name),
  }

  if (req.status === 'accepted') {
    const ldap = await getLdapClient()
    try {
      // Get all uid entries
      const { searchEntries: uidEntries } = await ldap.search(
        `ou=people,${ldapConfig.baseDn}`,
        {
          scope: 'sub',
          filter: '(uid=*)',
          attributes: ['uidNumber'],
        }
      )

      const today = new Date()
      const uidPrefix =
        today.getFullYear().toString() +
        today.getMonth().toString().padStart(2, '0')

      // Find the highest uid
      let maxUidNumber = uidEntries.reduce((maxUid, entry) => {
        const uid = entry['uidNumber']
        if (typeof uid === 'string' && uid.startsWith(uidPrefix)) {
          const curUid = parseInt(uid.substring(uidPrefix.length))
          return Math.max(maxUid, curUid)
        }
        return maxUid
      }, -1)

      if (maxUidNumber === -1) {
        maxUidNumber = 1
      }

      // Choose the first application field and get its gid
      const { searchEntries: gidEntries } = await ldap.search(
        `cn=${application.fields[0]},ou=group,${ldapConfig.baseDn}`,
        {
          attributes: ['gidNumber'],
          sizeLimit: 1,
        }
      )

      // Create the new users uid and password
      const uid = Array.from(application.firstName)[0]
        .concat(application.lastName)
        .toLowerCase()
      const pass = randomPassword()

      // Build and insert the new user entry
      const userEntry: Record<string, string | string[]> = {
        objectClass: ['inetOrgPerson', 'posixAccount'],
        sn: application.lastName,
        uid: uid,
        uidNumber: uidPrefix + ++maxUidNumber,
        gidNumber: gidEntries[0]['gidNumber'] as string,
        homeDirectory: `/home/${uid}`,
        loginShell: '/bin/false',
        gecos: `${application.firstName} ${application.lastName}`,
        givenName: application.firstName,
        mail: application.email,
        userPassword: `{SHA}${createHash('sha1').update(pass).digest('base64')}`,
      }

      if (application.phone) {
        userEntry['mobile'] = application.phone
      }

      // Try to create users the LDAP entry
      // If a user with the uid already exists, retry with a derivation of it
      let retryCount = 0
      const maxRetries = 5
      let retryUid

      while (retryCount < maxRetries) {
        try {
          let cn = `${application.firstName} ${application.lastName}`
          if (retryUid) {
            cn = cn + ` (${retryUid})`
          }

          await ldap.add(
            `cn=${cn},ou=people,${ldapConfig.baseDn}`,
            retryUid
              ? {
                  ...userEntry,
                  uid: retryUid,
                  homeDirectory: `/home/${retryUid}`,
                }
              : userEntry
          )

          console.info(`User ${cn} with password ${pass} added`)
          await sendEmail(rawApplication.email, uid, pass);

          break
        } catch (err) {
          if (err instanceof AlreadyExistsError) {
            // Get random derivation of uid
            retryCount++
            retryUid = uid + randomNumber()
          } else {
            throw err
          }
        }
      }

      if (retryCount === maxRetries) {
        throw new HTTPException(StatusCodes.BAD_REQUEST, {
          message: 'User with uid already exists',
        })
      }
    } finally {
      await ldap.unbind()
    }
  }

  // Update the application status
  const [dbResult] = await db
    .update(applications)
    .set({
      status: req.status,
    })
    .where(eq(applications.id, req.id))
    .returning({ id: applications.id, status: applications.status })

  return c.json(dbResult)
})
