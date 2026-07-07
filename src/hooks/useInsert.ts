import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { InsertField, InsertDialect } from '../types'
import { parseCreateTableDDL, parseFieldDefinitions, generatePGInsert, generateHiveInsert } from '../utils/insert'

export interface UseInsertReturn {
  insertExcelData: any[][] | null
  insertExcelHeaders: string[]
  insertDialect: InsertDialect
  insertTableName: string
  insertFields: InsertField[]
  insertParseText: string
  insertResult: string
  insertCopied: boolean

  setInsertDialect: (v: InsertDialect) => void
  setInsertTableName: (v: string) => void
  setInsertFields: (f: InsertField[]) => void
  setInsertParseText: (v: string) => void
  setInsertResult: (v: string) => void
  setInsertCopied: (v: boolean) => void

  insertHandleFile: (file: File) => Promise<void>
  insertApplyParse: () => void
  insertDoGenerate: () => void
}

export function useInsert(message: { success: (msg: string) => void; error: (msg: string) => void; warning: (msg: string) => void }): UseInsertReturn {
  const [insertExcelData, setInsertExcelData] = useState<any[][] | null>(null)
  const [insertExcelHeaders, setInsertExcelHeaders] = useState<string[]>([])
  const [insertDialect, setInsertDialect] = useState<InsertDialect>('hive')
  const [insertTableName, setInsertTableName] = useState('your_table_name')
  const [insertFields, setInsertFields] = useState<InsertField[]>([])
  const [insertParseText, setInsertParseText] = useState('')
  const [insertResult, setInsertResult] = useState('')
  const [insertCopied, setInsertCopied] = useState(false)

  const insertHandleFile = useCallback(async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
      if (rows.length < 2) { message.warning('文件内容不足2行'); return }
      setInsertExcelHeaders(rows[0].map(String).map(s => s.trim()).filter(Boolean))
      setInsertExcelData(rows.slice(1))
      // 自动从表头生成字段配置
      setInsertFields(rows[0].map((h: any) => ({ name: String(h).trim(), quoted: true, enabled: true })))
      message.success(`已加载 ${rows.length - 1} 行数据，${rows[0].length} 个字段`)
    } catch (err: any) { message.error('解析失败: ' + err.message) }
  }, [message])

  const insertApplyParse = useCallback(() => {
    const text = insertParseText.trim()
    if (!text) return
    // 尝试解析 DDL
    if (text.toLowerCase().includes('create table')) {
      const parsed = parseCreateTableDDL(text)
      if (parsed) { setInsertTableName(parsed.tableName); setInsertFields(parsed.fields); message.success('DDL 解析成功'); return }
    }
    // 解析字段定义行
    const fields = parseFieldDefinitions(text)
    if (fields.length > 0) { setInsertFields(fields); message.success(`解析到 ${fields.length} 个字段`); return }
    message.warning('无法识别的格式，请使用 CREATE TABLE DDL 或 字段名 类型 格式')
  }, [insertParseText, message])

  const insertDoGenerate = useCallback(() => {
    if (!insertExcelData || insertExcelData.length === 0 || insertFields.length === 0) { message.warning('请先上传数据并配置字段'); return }
    const genFn = insertDialect === 'pg' ? generatePGInsert : generateHiveInsert
    const lines = insertExcelData.map(row => genFn(insertTableName, insertFields, row))
    setInsertResult(lines.join('\n'))
    message.success(`已生成 ${lines.length} 条语句`)
  }, [insertExcelData, insertFields, insertTableName, insertDialect, message])

  return {
    insertExcelData, insertExcelHeaders, insertDialect, insertTableName, insertFields,
    insertParseText, insertResult, insertCopied,
    setInsertDialect, setInsertTableName, setInsertFields, setInsertParseText, setInsertResult, setInsertCopied,
    insertHandleFile, insertApplyParse, insertDoGenerate,
  }
}
