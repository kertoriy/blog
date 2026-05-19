import Redis from 'ioredis'

let redis: Redis | null = null

export function useRedis() {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true
    })
  }
  return redis
}

export async function pingRedis() {
  const client = useRedis()
  if (client.status !== 'ready') {
    await client.connect()
  }
  const result = await client.ping()
  return result === 'PONG'
}
