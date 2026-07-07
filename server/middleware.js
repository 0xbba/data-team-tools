import jwt from 'jsonwebtoken'
import { pool, JWT_SECRET } from './db.js'

// ============ 工具函数 ============

export function getUserInfo(req) {
  if (!req?.user) return {}
  return { userId: req.user.id, userName: req.user.displayName || req.user.username }
}

// ============ 认证中间件 ============

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' })
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'token无效或已过期' })
  }
}

// 权限检查中间件工厂
export function requirePerm(perm) {
  return async (req, res, next) => {
    try {
      const result = await pool.query('SELECT r.permissions FROM dt_users u JOIN dt_roles r ON u.role = r.role_key WHERE u.id = $1', [req.user.id])
      const perms = result.rows[0]?.permissions || []
      if (!perms.includes(perm)) return res.status(403).json({ error: '权限不足' })
      next()
    } catch (err) {
      console.error('[requirePerm]', err.message)
      return res.status(500).json({ error: '权限检查失败' })
    }
  }
}
