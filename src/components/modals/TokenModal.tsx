import { useState, useCallback } from 'react'
import { Modal, Input, Button, Table, Typography, Select, message, Popconfirm, Alert, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, CopyOutlined, CheckOutlined, KeyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Api } from '../../api'
import type { ApiToken } from '../../types'

interface TokenModalProps {
  open: boolean
  onCancel: () => void
}

const EXPIRE_OPTIONS = [
  { value: 'never', label: '永久有效' },
  { value: '30', label: '30 天' },
  { value: '90', label: '90 天' },
  { value: '180', label: '180 天' },
  { value: '365', label: '1 年' },
]

export default function TokenModal({ open, onCancel }: TokenModalProps) {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [expiresIn, setExpiresIn] = useState('never')
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<ApiToken | null>(null)

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    try {
      const list = await Api.tokenList()
      setTokens(list)
    } catch {
      message.error('加载 Token 列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpen = useCallback(() => {
    setNewToken(null)
    setNewName('')
    setExpiresIn('never')
    fetchTokens()
  }, [fetchTokens])

  const handleCreate = useCallback(async () => {
    setCreating(true)
    try {
      const result = await Api.tokenGenerate(newName || '默认', expiresIn)
      setNewToken(result)
      setNewName('')
      setExpiresIn('never')
      fetchTokens()
    } catch (err: any) {
      message.error(err.message || '创建失败')
    } finally {
      setCreating(false)
    }
  }, [newName, expiresIn, fetchTokens])

  const handleRevoke = useCallback(async (id: number) => {
    try {
      await Api.tokenRevoke(id)
      message.success('已吊销')
      fetchTokens()
    } catch {
      message.error('吊销失败')
    }
  }, [fetchTokens])

  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        message.success('已复制到剪贴板')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => {
        // clipboard API 失败时回退
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.cssText = 'position:fixed;left:-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        message.success('已复制到剪贴板')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    )
  }, [])

  return (
    <Modal
      open={open}
      title="API Token 管理"
      getContainer={() => document.body}
      onCancel={onCancel}
      afterOpenChange={visible => { if (visible) handleOpen() }}
      footer={null}
      width={Math.min(600, window.innerWidth - 32)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        {/* 说明 */}
        <Alert
          type="info"
          showIcon
          icon={<KeyOutlined />}
          message="API Token 用于 Chrome 扩展等外部工具调用接口，创建后请立即复制保存，系统不会再次显示明文。"
          style={{ fontSize: 13 }}
        />

        {/* 新建 Token */}
        {newToken ? (
          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 12 }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Token 已创建，请立即复制保存：
            </Typography.Text>
            <Input.TextArea
              value={newToken.token}
              readOnly
              autoSize={{ minRows: 2, maxRows: 3 }}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button type="primary" size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={() => handleCopy(newToken.token!)}>
                {copied ? '已复制' : '复制到剪贴板'}
              </Button>
              <Button size="small" onClick={() => setNewToken(null)}>
                关闭
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              placeholder="Token 名称（如：Chrome扩展）"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={50}
              onPressEnter={handleCreate}
              style={{ flex: 1 }}
            />
            <Select
              value={expiresIn}
              onChange={setExpiresIn}
              options={EXPIRE_OPTIONS}
              style={{ width: 110, flexShrink: 0 }}
            />
            <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={handleCreate}>
              创建
            </Button>
          </div>
        )}

        {/* Token 列表 */}
        <Table<ApiToken>
          dataSource={tokens}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 280 }}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              width: 100,
              ellipsis: true,
            },
            {
              title: '有效期',
              dataIndex: 'expiresAt',
              width: 110,
              render: (v: string, record: ApiToken) => {
                if (!v) return <Tag color="green">永久</Tag>
                if (record.expired) return <Tag color="red">已过期</Tag>
                return <span style={{ fontSize: 12 }}>{dayjs(v).format('YYYY-MM-DD')}</span>
              },
            },
            {
              title: '创建时间',
              dataIndex: 'createDate',
              width: 120,
              render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
            },
            {
              title: '最后使用',
              dataIndex: 'lastUsed',
              width: 120,
              render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : <Tag color="default">未使用</Tag>,
            },
            {
              title: '操作',
              width: 50,
              fixed: 'right',
              render: (_, record) => (
                <Popconfirm title="确定吊销此 Token？" description="吊销后使用该 Token 的工具将无法继续访问" onConfirm={() => handleRevoke(record.id)} okText="确定" cancelText="取消">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  )
}
