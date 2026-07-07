/**
 * P2: 数据需求台账 CRUD 测试
 */
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { getTestContext } from './helpers.js'

describe('P2: 数据需求台账 CRUD', () => {
  let app, adminToken, userToken
  let createdId
  const testRequestNo = 'TEST-' + Date.now()

  beforeAll(async () => {
    const ctx = await getTestContext()
    app = ctx.app
    adminToken = ctx.adminToken
    userToken = ctx.userToken
  })

  it('新增台账记录', async () => {
    const res = await request(app)
      .post('/api/ledger')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        request_no: testRequestNo,
        request_time: '2026-07-03 10:00:00',
        applicant: '测试申请人',
        applicant_dept: '测试部门',
        request_title: '测试标题',
        request_reason: '测试事由',
        processor: '测试处理人',
      })
    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    createdId = res.body.id
  })

  it('检查单号已存在', async () => {
    const res = await request(app)
      .get(`/api/ledger/check/${testRequestNo}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.exists).toBe(true)
    expect(res.body.record.requestNo).toBe(testRequestNo)
  })

  it('检查不存在的单号', async () => {
    const res = await request(app)
      .get('/api/ledger/check/NONEXIST-999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.exists).toBe(false)
  })

  it('查询台账列表（分页）', async () => {
    const res = await request(app)
      .get('/api/ledger?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThan(0)
    expect(res.body.rows).toBeInstanceOf(Array)
    expect(res.body.page).toBe(1)
  })

  it('搜索台账', async () => {
    const res = await request(app)
      .get(`/api/ledger?search=${testRequestNo}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.rows.length).toBeGreaterThan(0)
  })

  it('排序台账', async () => {
    const res = await request(app)
      .get('/api/ledger?sortBy=requestNo&sortOrder=ascend')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.rows).toBeInstanceOf(Array)
  })

  it('更新台账', async () => {
    const res = await request(app)
      .put(`/api/ledger/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ request_title: '测试标题_已修改' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('软删除台账', async () => {
    const res = await request(app)
      .delete(`/api/ledger/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('查询已删除台账', async () => {
    const res = await request(app)
      .get('/api/ledger/deleted')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  it('恢复已删除台账', async () => {
    const res = await request(app)
      .put(`/api/ledger/${createdId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('查询台账日志', async () => {
    const res = await request(app)
      .get('/api/ledger/logs')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.rows).toBeInstanceOf(Array)
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('查询台账日志（按记录ID）', async () => {
    const res = await request(app)
      .get(`/api/ledger/logs?recordId=${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.rows).toBeInstanceOf(Array)
  })
})
