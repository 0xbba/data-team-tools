import { STORAGE_KEY, LOCAL_LEDGER_KEY } from '../constants'
import type { MappingItem, LedgerRecord } from '../types'

// ============ 映射数据 ============
export function loadMappingFromStorage(): MappingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

export function saveMappingToStorage(data: MappingItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* 存储空间不足时静默失败 */ }
}

// ============ 台账数据（本地模式） ============
export function loadLedgerFromStorage(): LedgerRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEDGER_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

export function saveLedgerToStorage(data: LedgerRecord[]) {
  try { localStorage.setItem(LOCAL_LEDGER_KEY, JSON.stringify(data)) } catch { /* 存储空间不足时静默失败 */ }
}
