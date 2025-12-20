export function requestIdMiddleware(headerName = 'x-request-id') {
  return async (c: any, next: any) => {
    // try to use incoming header, otherwise generate a short id
    const incoming = c.req.header(headerName)
    const id = incoming || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`

    // store on context for handlers and middleware
    try {
      c.set('requestId', id)
    } catch (_) {
      // ignore if context doesn't support set
    }

    // also expose as response header
    c.header(headerName, id)

    return next()
  }
}
