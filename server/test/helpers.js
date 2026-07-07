/**
 * 测试工具：提供 app 实例、登录 token 等共享资源
 * 每个测试文件 import 这个模块即可
 */
import { beforeAll } from 'vitest'
import request from 'supertest'

let _app = null
let _adminToken = null
let _userToken = null

/**
 * 在测试文件中调用，确保 app 已初始化
 * 返回 { app, adminToken, userToken }
 */
export async function getTestContext() {
  if (_app) return { app: _app, adminToken: _adminToken, userToken: _userToken }

  // 导入 server 模块（setup 已设置好环境变量和建表）
  const server = await import('../server.js')
  _app = server.app

  // admin 登录
  const adminRes = await request(_app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' })
  _adminToken = adminRes.body.token

  // user 登录
  const userRes = await request(_app)
    .post('/api/auth/login')
    .send({ username: 'testuser', password: 'test123' })
  _userToken = userRes.body.token

  return { app: _app, adminToken: _adminToken, userToken: _userToken }
}

/** 发请求的快捷方法：带 admin token */
export function adminRequest(app, token) {
  return request(app).set('Authorization', `Bearer ${token}`)
}

/** 发请求的快捷方法：带 user token */
export function userRequest(app, token) {
  return request(app).set('Authorization', `Bearer ${token}`)
}
