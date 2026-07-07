import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool, JWT_SECRET, JWT_EXPIRES } from '../db.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' })
    const result = await pool.query('SELECT id, username, password_hash, role, display_name, is_active FROM dt_users WHERE username = $1', [username])
    const user = result.rows[0]
    if (!user || !user.is_active) return res.status(401).json({ error: '用户不存在或已禁用' })
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: '密码错误' })
    const roleResult = await pool.query('SELECT role_name, permissions FROM dt_roles WHERE role_key = $1', [user.role])
    const roleInfo = roleResult.rows[0] || { role_name: user.role, permissions: [] }
    const token = jwt.sign({ id: user.id, username: user.username, displayName: user.display_name || user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, roleName: roleInfo.role_name, displayName: user.display_name || user.username, permissions: roleInfo.permissions } })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    res.status(500).json({ error: err.message })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, display_name, is_active FROM dt_users WHERE id = $1', [req.user.id])
    const user = result.rows[0]
    if (!user || !user.is_active) return res.status(401).json({ error: '用户不存在或已禁用' })
    const roleResult = await pool.query('SELECT role_name, permissions FROM dt_roles WHERE role_key = $1', [user.role])
    const roleInfo = roleResult.rows[0] || { role_name: user.role, permissions: [] }
    res.json({ id: user.id, username: user.username, role: user.role, roleName: roleInfo.role_name, displayName: user.display_name || user.username, permissions: roleInfo.permissions })
  } catch (err) {
    console.error('[GET /api/auth/me]', err)
    res.status(500).json({ error: err.message })
  }
})

// 修改自己的密码
router.put('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return res.status(400).json({ error: '请输入旧密码和新密码' })
    const result = await pool.query('SELECT password_hash FROM dt_users WHERE id = $1', [req.user.id])
    const user = result.rows[0]
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) return res.status(400).json({ error: '旧密码错误' })
    const hash = bcrypt.hashSync(newPassword, 10)
    await pool.query('UPDATE dt_users SET password_hash = $1, last_modified = NOW() WHERE id = $2', [hash, req.user.id])
    res.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/auth/password]', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
