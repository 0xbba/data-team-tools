/**
 * P3: 用户/角色管理测试
 */
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { getTestContext } from './helpers.js'

describe('P3: 用户管理', () => {
  let app, adminToken, userToken
  let createdUserId

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
    userToken = ctx.userToken
  })

  it('管理员获取用户列表', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body.length).toBeGreaterThanOrEqual(2) // admin + testuser
  })

  it('获取用户 displayName 列表', async () => {
    const res = await request(app)
      .get('/api/users/display-names')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  it('创建用户', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newuser', password: 'pass123', role: 'user', displayName: '新用户' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    createdUserId = res.body.id
  })

  it('创建重复用户名应 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newuser', password: 'pass456', role: 'user' })
    expect(res.status).toBe(400)
  })

  it('更新用户', async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ displayName: '修改后的名字' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('删除用户', async () => {
    const res = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('不能删除自己', async () => {
    // 先用 newuser2 登录再删自己（比较复杂），这里直接测 admin 删 admin
    // 通过 admin 的 id 来测试
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
    const adminId = meRes.body.id
    const res = await request(app)
      .delete(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })

  it('修改密码', async () => {
    // 创建临时用户测试改密码
    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'pwdtest', password: 'old123', role: 'user', displayName: '改密测试' })
    // 登录
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pwdtest', password: 'old123' })
    const token = loginRes.body.token
    // 改密码
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'old123', newPassword: 'new456' })
    expect(res.status).toBe(200)
    // 用新密码登录
    const reloginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pwdtest', password: 'new456' })
    expect(reloginRes.status).toBe(200)
  })
})

describe('P3: 角色管理', () => {
  let app, adminToken
  let createdRoleId

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
  })

  it('获取角色列表', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    // 至少有 admin 和 user 两个内置角色
    expect(res.body.some(r => r.role_key === 'admin')).toBe(true)
    expect(res.body.some(r => r.role_key === 'user')).toBe(true)
  })

  it('获取权限树', async () => {
    const res = await request(app)
      .get('/api/permissions')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  it('创建自定义角色', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleKey: 'custom_role', roleName: '自定义角色', permissions: ['translate', 'insertgen'] })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    createdRoleId = res.body.id
  })

  it('更新角色', async () => {
    const res = await request(app)
      .put(`/api/roles/${createdRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: '修改后角色名', permissions: ['translate', 'insertgen', 'multidate'] })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('删除自定义角色', async () => {
    const res = await request(app)
      .delete(`/api/roles/${createdRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('删除内置角色应 400', async () => {
    const rolesRes = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
    const adminRole = rolesRes.body.find(r => r.role_key === 'admin')
    const res = await request(app)
      .delete(`/api/roles/${adminRole.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })
})
