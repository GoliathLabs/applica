import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Login } from '../models/auth'
import { getLdapClient, ldapConfig, safeUnbind } from '../ldap'
import { HTTPException } from 'hono/http-exception'
import { Client } from 'ldapts'
import { StatusCodes } from 'http-status-codes'
import { logger } from '../common/logger'
import { jwt, sign } from 'hono/jwt'
import { env } from 'hono/adapter'

export const app = new Hono().basePath('/auth')

app.post('/login', zValidator('json', Login), async (c) => {
  const req = c.req.valid('json')
  let ldapAdmin
  try {
    ldapAdmin = await getLdapClient()
  } catch (err) {
    // LDAP backend unavailable
    logger.error('LDAP unavailable for login', { err: String(err) })
    throw new HTTPException(StatusCodes.SERVICE_UNAVAILABLE, {
      message: 'Authentication service unavailable',
    })
  }

  try {
    // Search for a user with the specified username
    const { searchEntries: userEntries } = await ldapAdmin.search(
      `ou=people,${ldapConfig.baseDn}`,
      {
        scope: 'sub',
        filter: `(uid=${req.userName})`,
        attributes: ['dn', 'cn', 'uid'],
      }
    )

    // No user with username found
    if (userEntries.length === 0) {
      throw new HTTPException(StatusCodes.UNAUTHORIZED, {
        message: 'Username or password is incorrect',
      })
    }

    // Do a LDAP bind to verify the users password
    const ldapUser = new Client({ url: ldapConfig.url })
    await ldapUser.bind(userEntries[0].dn, req.password)
      await ldapUser.unbind()

    // Check if the user is a field leader and therefore
    // has access to protected routes and the dashboard
    const { searchEntries: groupEntries } = await ldapAdmin.search(
      ldapConfig.fieldLeaderDn,
      {
        scope: 'base',
        filter: `(memberuid=${req.userName})`,
        attributes: ['cn'],
      }
    )

    // Not a field leader
    if (groupEntries.length === 0) {
      throw new HTTPException(StatusCodes.FORBIDDEN, {
        message: 'Access denied. Only field leaders can login.',
      })
    }

    const payload = {
      sub: req.userName,
      name: userEntries[0]['cn'],
      // Token expires in 30 minutes
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    }

    return c.json({
      user: payload,
      token: await sign(payload, env<{ JWT_SECRET: string }>(c).JWT_SECRET),
    })
  } catch (err) {
    if (err instanceof HTTPException) throw err

    logger.warn('Authentication failed', { err: String(err) })

    // For LDAP specific errors we return a generic unauthorized to avoid leaking details
    throw new HTTPException(StatusCodes.UNAUTHORIZED, {
      message: 'Username or password is incorrect',
    })
  } finally {
    await safeUnbind(ldapAdmin)
  }
})

app.use('*', (c, next) => {
  const secret = env<{ JWT_SECRET: string }>(c).JWT_SECRET

  if (!secret) {
    console.error('JWT secret missing in environment for protected auth routes')
    return c.json({ message: 'Server misconfigured' }, StatusCodes.INTERNAL_SERVER_ERROR)
  }

  const jwtMiddleware = jwt({ secret, options: { algorithms: ['HS256'] } as any })

  return jwtMiddleware(c, next)
})

app.get('/verify', (c) => {
  const user = c.get('jwtPayload')

  return c.json({
    user: user,
  })
})
