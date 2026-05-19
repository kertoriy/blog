type ServiceCheck = {
  ok: boolean
  error?: string
}

async function checkService(run: () => Promise<void>): Promise<ServiceCheck> {
  try {
    await run()
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return { ok: false, error: message }
  }
}

export default defineEventHandler(async (event) => {
  const [mysql, mongodb, redis] = await Promise.all([
    checkService(async () => {
      await pingMysql()
    }),
    checkService(async () => {
      await pingMongo()
    }),
    checkService(async () => {
      await pingRedis()
    })
  ])

  const services = { mysql, mongodb, redis }
  const ok = Object.values(services).every(service => service.ok)

  setResponseStatus(event, ok ? 200 : 503)

  return {
    ok,
    services,
    timestamp: new Date().toISOString()
  }
})
