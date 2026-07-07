/**
 * P0: 启动自检 — 确保每个路由都能正常加载（不 500）
 * P1: 认证流程 — 登录、me、改密码
 * P1: 权限拦截 — 未登录 401、无权限 403
 */
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { getTestContext, adminRequest, userRequest } from './helpers.js'

describe('P0: 启动自检', () => {
  let app, adminToken, userToken

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
    userToken = ctx.userToken
  })

  // 无需认证的公开路由
  const publicRoutes = [
    ['POST', '/api/auth/login'],
    ['GET', '/api/health'],
  ]

  // 需认证的路由（用 admin token）
  const protectedRoutes = [
    ['GET', '/api/auth/me'],
    ['GET', '/api/translations'],
    ['GET', '/api/users'],
    ['GET', '/api/roles'],
    ['GET', '/api/permissions'],
    ['GET', '/api/ledger'],
    ['GET', '/api/logs'],
  ]

  it.each(publicRoutes)('%s %s 应返回非 500 状态码', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path)
    // 只要不是 500 就算通过（401/400/404 都是正常的，说明路由加载了）
    expect(res.status).not.toBe(500)
  })

  it.each(protectedRoutes)('%s %s 带 token 应返回非 500', async (method, path) => {
    const res = await request(app)
      [method.toLowerCase()](path)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).not.toBe(500)
  })
})

describe('P1: 认证流程', () => {
  let app, adminToken

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
  })

  it('登录: 正确密码应返回 token 和用户信息', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.username).toBe('admin')
    expect(res.body.user.role).toBe('admin')
    expect(res.body.user.permissions).toBeInstanceOf(Array)
  })

  it('登录: 错误密码应返回 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('登录: 缺少字段应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})
    expect(res.status).toBe(400)
  })

  it('/api/auth/me: 带 token 应返回当前用户', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.username).toBe('admin')
  })

  it('/api/auth/me: 无 token 应返回 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('/api/auth/me: 错误 token 应返回 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(res.status).toBe(401)
  })
})

describe('P1: 权限拦截', () => {
  let app, adminToken, userToken

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
    userToken = ctx.userToken
  })

  // user 角色没有 user_manage 权限
  it('普通用户访问用户管理应返回 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })

  // user 角色没有 role_manage 权限
  it('普通用户访问角色管理应返回 403', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })

  // admin 有所有权限
  it('管理员访问用户管理应返回 200', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  // 未认证访问受保护路由
  it('未认证访问受保护路由应返回 401', async () => {
    const res = await request(app).get('/api/translations')
    expect(res.status).toBe(401)
  })
})
