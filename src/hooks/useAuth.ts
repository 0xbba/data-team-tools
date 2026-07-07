import { useState, useCallback } from 'react'
import { Api } from '../api'
import { saveToken, clearToken } from '../utils/auth'
import type { AuthUser } from '../Login'

export interface UseAuthReturn {
  currentUser: AuthUser | null
  authChecking: boolean
  setAuthChecking: (v: boolean) => void
  setLocalUser: () => void
  passwordModalOpen: boolean
  setPasswordModalOpen: (v: boolean) => void
  pwdOld: string
  pwdNew: string
  pwdNew2: string
  pwdLoading: boolean
  setPwdOld: (v: string) => void
  setPwdNew: (v: string) => void
  setPwdNew2: (v: string) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  handleChangePassword: () => Promise<void>
}

export function useAuth(message: { success: (msg: string) => void; error: (msg: string) => void; warning: (msg: string) => void }): UseAuthReturn {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdNew2, setPwdNew2] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await Api.login(username, password)
      saveToken(res.token)
      setCurrentUser(res.user)
    } catch (err: any) {
      throw err
    }
  }, [message])

  const logout = useCallback(() => {
    clearToken()
    setCurrentUser(null)
  }, [])

  const setLocalUser = useCallback(() => {
    setCurrentUser({ id: 0, username: 'local', role: 'admin', roleName: '本地管理员', displayName: '本地用户', permissions: ['translate', 'insertgen', 'multidate', 'manage_view', 'manage_edit', 'manage_delete', 'manage_restore', 'manage_log', 'ledger_parse', 'ledger_view', 'ledger_edit', 'ledger_delete', 'ledger_restore', 'ledger_log'] })
  }, [])

  const fetchMe = useCallback(async () => {
    try {
      const user = await Api.me()
      setCurrentUser(user)
    } catch {
      clearToken()
      setCurrentUser(null)
    }
  }, [])

  const handleChangePassword = useCallback(async () => {
    if (!pwdNew || pwdNew !== pwdNew2) { message.warning('请确认新密码一致'); return }
    setPwdLoading(true)
    try {
      await Api.changePassword(pwdOld, pwdNew)
      message.success('密码修改成功')
      setPasswordModalOpen(false)
      setPwdOld(''); setPwdNew(''); setPwdNew2('')
    } catch (err: any) { message.error(err.message) }
    finally { setPwdLoading(false) }
  }, [pwdOld, pwdNew, pwdNew2, message])

  return {
    currentUser, authChecking, setAuthChecking, setLocalUser,
    passwordModalOpen, setPasswordModalOpen,
    pwdOld, setPwdOld, pwdNew, setPwdNew, pwdNew2, setPwdNew2, pwdLoading,
    login, logout, fetchMe, handleChangePassword,
  }
}
