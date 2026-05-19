// 创建业务库与应用账号（仅首次初始化数据目录时执行）
const dbName = 'ker_edit_blog'
const appUser = 'ker_blog'
const appPassword = 'Dev123456@'

const appDb = db.getSiblingDB(dbName)

appDb.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: dbName }]
})
