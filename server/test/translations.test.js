/**
 * P2: 字段翻译 CRUD 测试
 */
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { getTestContext } from './helpers.js'

describe('P2: 字段翻译 CRUD', () => {
  let app, adminToken, userToken
  let createdId

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
    userToken = ctx.userToken
  })

  it('新增翻译记录', async () => {
    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ original: 'test_field', chinese: '测试字段' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    createdId = res.body.id
  })

  it('新增: 缺少必填字段应 400', async () => {
    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ original: 'only_name' })
    expect(res.status).toBe(400)
  })

  it('查询翻译列表', async () => {
    const res = await request(app)
      .get('/api/translations')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  it('搜索翻译', async () => {
    const res = await request(app)
      .get('/api/translations?search=test_field')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.some(r => r.original === 'test_field')).toBe(true)
  })

  it('更新翻译', async () => {
    const res = await request(app)
      .put(`/api/translations/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ chinese: '测试字段_已修改' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('更新: 内容不变应返回 unchanged', async () => {
    const res = await request(app)
      .put(`/api/translations/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ chinese: '测试字段_已修改' })
    expect(res.status).toBe(200)
    expect(res.body.unchanged).toBe(true)
  })

  it('软删除翻译', async () => {
    const res = await request(app)
      .delete(`/api/translations/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('查询已删除记录', async () => {
    const res = await request(app)
      .get('/api/translations/deleted')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  it('恢复已删除记录', async () => {
    const res = await request(app)
      .put(`/api/translations/${createdId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('查询翻译日志', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.rows).toBeInstanceOf(Array)
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('批量导入', async () => {
    const res = await request(app)
      .post('/api/translations/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          { original: 'batch_field_1', chinese: '批量字段1' },
          { original: 'batch_field_2', chinese: '批量字段2' },
        ]
      })
    expect(res.status).toBe(200)
    expect(res.body.inserted).toBe(2)
  })

  it('批量导入: 重复字段名应跳过', async () => {
    const res = await request(app)
      .post('/api/translations/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          { original: 'batch_field_1', chinese: '批量字段1_重复' },
          { original: 'batch_field_3', chinese: '批量字段3' },
        ]
      })
    expect(res.status).toBe(200)
    expect(res.body.skipped).toBe(1)
    expect(res.body.inserted).toBe(1)
  })
})
