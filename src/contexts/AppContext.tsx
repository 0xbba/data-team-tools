import { createContext, useContext } from 'react'
import type { MessageInstance } from 'antd/es/message/interface'
import type { HookAPI as ModalAPI } from 'antd/es/modal/useModal'
import type { AuthUser } from '../Login'
import type { MappingItem } from '../types'

// ============ 应用上下文类型 ============
export interface AppContextType {
  // Antd 实例
  message: MessageInstance
  modal: ModalAPI

  // 认证
  currentUser: AuthUser | null
  hasPerm: (key: string) => boolean
  isAdmin: () => boolean

  // 数据库连接
  dataMode: 'local' | 'database'
  offlineMode: boolean
  dbUrl: string
  dbConnected: boolean
  dbError: string
  dbLoading: boolean

  // 映射数据（翻译+管理共享）
  mappingData: MappingItem[]
  fetchDbMapping: () => void
  persistMapping: () => void
}

export const AppContext = createContext<AppContextType | null>(null)

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
