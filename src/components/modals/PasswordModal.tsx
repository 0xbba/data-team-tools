import { Modal, Input } from 'antd'
import { LockOutlined as LockOutlinedRev } from '@ant-design/icons'

interface PasswordModalProps {
  open: boolean
  loading: boolean
  oldPwd: string
  newPwd: string
  newPwd2: string
  onOldPwdChange: (v: string) => void
  onNewPwdChange: (v: string) => void
  onNewPwd2Change: (v: string) => void
  onOk: () => void
  onCancel: () => void
}

export default function PasswordModal({ open, loading, oldPwd, newPwd, newPwd2, onOldPwdChange, onNewPwdChange, onNewPwd2Change, onOk, onCancel }: PasswordModalProps) {
  return (
    <Modal
      open={open}
      title="修改密码"
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={loading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
        <Input.Password prefix={<LockOutlinedRev />} placeholder="旧密码" value={oldPwd} onChange={e => onOldPwdChange(e.target.value)} />
        <Input.Password prefix={<LockOutlinedRev />} placeholder="新密码（至少6位）" value={newPwd} onChange={e => onNewPwdChange(e.target.value)} />
        <Input.Password prefix={<LockOutlinedRev />} placeholder="确认新密码" value={newPwd2} onChange={e => onNewPwd2Change(e.target.value)} />
      </div>
    </Modal>
  )
}
