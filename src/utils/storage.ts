import { STORAGE_KEY, LOCAL_LEDGER_KEY } from '../constants'
import type { MappingItem, LedgerRecord } from '../types'

// ============ 映射数据 ============
export function loadMappingFromStorage(): MappingItem[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return []; return JSON.parse(raw) } catch { return [] }
}

export function saveMappingToStorage(data: MappingItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ============ 台账数据（本地模式） ============
export function loadLedgerFromStorage(): LedgerRecord[] {
  try { const raw = localStorage.getItem(LOCAL_LEDGER_KEY); if (!raw) return []; return JSON.parse(raw) } catch { return [] }
}

export function saveLedgerToStorage(data: LedgerRecord[]) {
  localStorage.setItem(LOCAL_LEDGER_KEY, JSON.stringify(data))
}
