import pg from 'pg'

// 数据库配置（环境变量 → 通用默认值，本地开发请通过环境变量传入实际值）
export const pgHost = process.env.PGHOST || 'localhost'
export const pgPort = parseInt(process.env.PGPORT || '5432', 10)
export const pgUser = process.env.PGUSER || 'dtapp'
export const pgPassword = process.env.PGPASSWORD || ''
export const pgDatabase = process.env.PGDATABASE || 'data_team_tools'
export const pgSchema = process.env.PGSCHEMA || 'public'

// JWT 配置
export const JWT_SECRET = process.env.JWT_SECRET || 'field-translator-secret-key-change-in-production'
export const JWT_EXPIRES = '7d'

// 安全警告：使用默认值时提醒
if (!process.env.JWT_SECRET) {
  console.warn('\x1b[33m[WARN] JWT_SECRET 未设置，使用默认密钥，请通过环境变量 JWT_SECRET 配置安全密钥！\x1b[0m')
}
if (!process.env.PGPASSWORD) {
  console.warn('\x1b[33m[WARN] PGPASSWORD 未设置，使用默认密码，请通过环境变量 PGPASSWORD 配置数据库密码！\x1b[0m')
}

// 连接池
export const pool = new pg.Pool({
  host: pgHost,
  port: pgPort,
  user: pgUser,
  password: pgPassword,
  database: pgDatabase,
  options: `-c search_path=${pgSchema}`,
})
