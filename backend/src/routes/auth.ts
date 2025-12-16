import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Login } from '../models/auth'
import { getLdapClient, ldapConfig } from '../ldap'
import { HTTPException } from 'hono/http-exception'
import { Client } from 'ldapts'
import { StatusCodes } from 'http-status-codes'
import { jwt, sign } from 'hono/jwt'
import { env } from 'hono/adapter'
import { StatusCodes } from 'http-status-codes'

export const app = new Hono().basePath('/auth')

app.post('/login', zValidator('json', Login), async (c) => {
  const req = c.req.valid('json')
  const ldapAdmin = await getLdapClient()

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

    // Check if the user is a field leader and therefor
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
    if (err instanceof HTTPException) {
      throw err
    }

    throw new HTTPException(StatusCodes.UNAUTHORIZED, {
      message: 'Username or password is incorrect',
    })
  } finally {
    await ldapAdmin.unbind()
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
