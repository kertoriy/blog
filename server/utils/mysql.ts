import mysql from 'mysql2/promise'
import type { Pool } from 'mysql2/promise'

let pool: Pool | null = null

export function useMysqlPool() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      database: config.mysql.database,
      user: config.mysql.user,
      password: config.mysql.password,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4'
    })
  }
  return pool
}

export async function pingMysql() {
  const connection = await useMysqlPool().getConnection()
  try {
    await connection.query('SELECT 1')
    return true
  } finally {
    connection.release()
  }
}
