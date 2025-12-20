import { StatusCodes } from 'http-status-codes'

export function limitBodySize(maxBytes = 1024 * 100) {
  return async (c: any, next: any) => {
    try {
      const lenHeader = c.req.header('content-length')
      if (lenHeader) {
        const len = parseInt(lenHeader, 10)
        if (!Number.isNaN(len) && len > maxBytes) {
          return c.json({ message: 'Payload too large' }, StatusCodes.PAYLOAD_TOO_LARGE)
        }
      }

      // If no content-length header, we don't eagerly read the body here to
      // avoid interfering with downstream parsers. Optionally, you can read
      // and enforce a hard limit by streaming the body.

      return next()
    } catch (err) {
      return c.json({ message: 'Invalid request' }, StatusCodes.BAD_REQUEST)
    }
  }
}
