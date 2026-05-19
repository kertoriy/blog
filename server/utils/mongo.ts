import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function useMongoDb() {
  if (!db) {
    const config = useRuntimeConfig()
    client = new MongoClient(config.mongodb.uri)
    await client.connect()
    db = client.db(config.mongodb.database)
  }
  return db
}

export async function pingMongo() {
  const database = await useMongoDb()
  await database.command({ ping: 1 })
  return true
}
