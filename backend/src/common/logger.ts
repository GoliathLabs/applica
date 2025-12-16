type Meta = Record<string, unknown>

function format(level: string, message: string, meta?: Meta) {
  const out = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && { meta }),
  }
  return JSON.stringify(out)
}

export const logger = {
  info: (message: string, meta?: Meta) => {
    console.log(format('info', message, meta))
  },
  warn: (message: string, meta?: Meta) => {
    console.warn(format('warn', message, meta))
  },
  error: (message: string, meta?: Meta) => {
    console.error(format('error', message, meta))
  },
  debug: (message: string, meta?: Meta) => {
    console.debug(format('debug', message, meta))
  },
}

export default logger
