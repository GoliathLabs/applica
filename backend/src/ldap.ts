import { Client } from 'ldapts'
import { getEnv } from './common/util'

export const ldapConfig = {
  url: getEnv('LDAP_URL'),
  baseDn: getEnv('LDAP_BASE_DN'),
  adminDn: process.env.LDAP_ADMIN_DN || `cn=admin,${getEnv('LDAP_BASE_DN')}`,
  adminPassword: getEnv('LDAP_ADMIN_PASSWORD'),
  fieldLeaderDn: getEnv('LDAP_LEADER_DN'),
  // timeout for LDAP ops in ms
  opTimeout: Number(process.env.LDAP_OP_TIMEOUT) || 5_000,
}

async function bindWithTimeout(client: Client, dn: string, password: string, timeoutMs: number) {
  return Promise.race([
    client.bind(dn, password),
    new Promise((_, rej) => setTimeout(() => rej(new Error('LDAP bind timeout')), timeoutMs)),
  ])
}

export async function getLdapClient(): Promise<Client> {
  const client = new Client({
    url: ldapConfig.url,
    // best-effort socket/connect timeouts (may be ignored depending on environment)
    timeout: ldapConfig.opTimeout,
    connectTimeout: ldapConfig.opTimeout,
  } as any)

  try {
    await bindWithTimeout(client, ldapConfig.adminDn, ldapConfig.adminPassword, ldapConfig.opTimeout)
  } catch (err) {
    try {
      await client.unbind()
    } catch (_) {
      // ignore unbind errors during failure path
    }

    // rethrow a sanitized error
    const e = err instanceof Error ? err : new Error(String(err))
    e.message = 'LDAP unavailable'
    throw e
  }

  return client
}

export async function safeUnbind(client?: Client) {
  if (!client) return
  try {
    await client.unbind()
  } catch (err) {
    // log and ignore - unbind failures should not crash the request
    // eslint-disable-next-line no-console
    console.warn('LDAP unbind failed:', err)
  }
}
