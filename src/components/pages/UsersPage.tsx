import { useState, useMemo } from 'react'
import { Typography, Button, Table, Modal, Tag, Input, Select, Switch, Popconfirm, Tooltip } from 'antd'
import { UserOutlined, LockOutlined as LockOutlinedRev, PlusOutlined, EditOutlined, StopOutlined, SearchOutlined } from '@ant-design/icons'
import type { MessageInstance } from 'antd/es/message/interface'
import { Api } from '../../api'
import { useIsSmallScreen } from '../../hooks/useResponsive'
import { PAGE_SIZE_OPTIONS } from '../../constants'
import type { UserForm } from '../../types'
import type { AuthUser } from '../../Login'

interface UsersPageProps {
  usersData: any[]
  rolesData: any[]
  fetchUsers: () => void
  currentUser: AuthUser | null
  message: MessageInstance
}

export default function UsersPage({ usersData, rolesData, fetchUsers, currentUser, message }: UsersPageProps) {
  const isSmall = useIsSmallScreen()
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userEditMode, setUserEditMode] = useState<'add' | 'edit'>('add')
  const [userEditId, setUserEditId] = useState<number | null>(null)
  const [userForm, setUserForm] = useState<UserForm>({ username: '', password: '', role: 'user', displayName: '', isActive: true })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const filteredData = useMemo(() => {
    if (!search.trim()) return usersData
    const s = search.toLowerCase()
    return usersData.filter((u: any) =>
      u.username?.toLowerCase().includes(s) ||
      u.displayName?.toLowerCase().includes(s) ||
      u.role?.toLowerCase().includes(s)
    )
  }, [usersData, search])

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Typography.Text strong>用户列表（共 {filteredData.length} 人）</Typography.Text>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input size="small" placeholder="搜索用户" prefix={<SearchOutlined style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }} />} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} allowClear style={{ width: 160 }} />
          <Button type="primary" size="small" icon={<PlusOutlined style={{ fontSize: 14 }} />} onClick={() => {
            setUserEditMode('add'); setUserEditId(null); setUserForm({ username: '', password: '', role: 'user', displayName: '', isActive: true }); setUserModalOpen(true)
          }}>新增用户</Button>
        </div>
      </div>
      <Table
        size="small"
        dataSource={paginatedData}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: filteredData.length,
          showSizeChanger: !isSmall,
          pageSizeOptions: PAGE_SIZE_OPTIONS as unknown as (number | string)[],
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          showTotal: (t) => `共 ${t} 条`,
          size: isSmall ? 'small' : undefined,
        }}
        scroll={{ x: 600 }}
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id', width: 50, sorter: (a, b) => a.id - b.id },
          { title: '用户名', dataIndex: 'username', key: 'username', width: 120, sorter: (a, b) => (a.username || '').localeCompare(b.username || '') },
          { title: '姓名', dataIndex: 'displayName', key: 'displayName', width: 120, sorter: (a, b) => (a.displayName || '').localeCompare(b.displayName || ''), render: (v) => v || '-' },
          { title: '角色', dataIndex: 'role', key: 'role', width: 100, render: (v) => { const r = rolesData.find((rd: any) => rd.role_key === v); return <Tag color={v === 'admin' ? 'blue' : 'default'}>{r ? r.role_name : v}</Tag> } },
          { title: '状态', dataIndex: 'isActive', key: 'isActive', width: 80, render: (v) => <Tag color={v ? 'success' : 'error'}>{v ? '启用' : '禁用'}</Tag> },
          {
            title: '操作', key: 'action', width: 80, align: 'center' as const, fixed: 'right' as const,
            render: (_, r) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Tooltip title="编辑"><Button type="text" size="small" onClick={() => {
                  setUserEditMode('edit'); setUserEditId(r.id)
                  setUserForm({ username: r.username, password: '', role: r.role, displayName: r.displayName, isActive: r.isActive })
                  setUserModalOpen(true)
                }} icon={<EditOutlined style={{ fontSize: 14 }} />} /></Tooltip>
                <Popconfirm title="确定禁用该用户？" onConfirm={async () => {
                  try { await Api.userDelete(r.id); message.success('已禁用'); fetchUsers() } catch (err: any) { message.error(err.message); throw err }
                }}>
                  <Tooltip title="禁用"><Button type="text" size="small" danger disabled={r.id === currentUser?.id || !r.isActive} icon={<StopOutlined style={{ fontSize: 14 }} />} /></Tooltip>
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={userModalOpen}
        title={userEditMode === 'add' ? '新增用户' : '编辑用户'}
        onCancel={() => setUserModalOpen(false)}
        centered
        getContainer={() => document.body}
        onOk={async () => {
          if (userEditMode === 'add') {
            if (!userForm.username || !userForm.password) { message.warning('用户名和密码必填'); return }
            try { await Api.userAdd(userForm); message.success('添加成功'); setUserModalOpen(false); fetchUsers() }
            catch (err: any) { message.error(err.message) }
          } else {
            const fields: Partial<UserForm> = { role: userForm.role, displayName: userForm.displayName, isActive: userForm.isActive }
            if (userForm.password) fields.password = userForm.password
            try { await Api.userUpdate(userEditId!, fields); message.success('修改成功'); setUserModalOpen(false); fetchUsers() }
            catch (err: any) { message.error(err.message) }
          }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
          <Input prefix={<UserOutlined />} placeholder="用户名" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} disabled={userEditMode === 'edit'} />
          <Input.Password prefix={<LockOutlinedRev />} placeholder={userEditMode === 'edit' ? '留空不修改密码' : '密码'} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
          <Input placeholder="显示名称" value={userForm.displayName} onChange={e => setUserForm(f => ({ ...f, displayName: e.target.value }))} />
          <Select value={userForm.role} onChange={v => setUserForm(f => ({ ...f, role: v }))} options={rolesData.map(r => ({ value: r.role_key, label: `${r.role_name} (${r.role_key})` }))} placeholder="选择角色" />
          {userEditMode === 'edit' && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: '0.85rem' }}>状态：</span><Switch checked={userForm.isActive} onChange={v => setUserForm(f => ({ ...f, isActive: v }))} checkedChildren="启用" unCheckedChildren="禁用" /></div>}
        </div>
      </Modal>
    </div>
  )
}
