import type { InsertField } from '../types'

// ============ DDL 解析 ============
export interface ParsedDDL {
  tableName: string
  fields: InsertField[]
}

/** 解析 CREATE TABLE DDL */
export function parseCreateTableDDL(ddl: string): ParsedDDL | null {
  const tableMatch = ddl.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?([\w.]+)/i)
  if (!tableMatch) return null
  // 支持 schema.table 格式
  const tableName = tableMatch[1].replace(/^[\w.]+\./, '') // 去掉 schema 前缀，只保留表名
  const bodyMatch = ddl.match(/\(([\s\S]+)\)/)
  if (!bodyMatch) return null
  return { tableName, fields: parseFieldDefinitions(bodyMatch[1]) }
}

/** 根据字段类型判断值是否需要加引号 */
function shouldQuoteByType(type: string): boolean {
  const t = type.toLowerCase().replace(/\([^)]*\)/, '').trim()
  const unquotedTypes = new Set([
    'int', 'integer', 'bigint', 'smallint', 'serial', 'bigserial', 'smallserial',
    'numeric', 'decimal', 'real', 'float', 'double', 'double precision',
    'int2', 'int4', 'int8', 'float4', 'float8',
    'bool', 'boolean',
  ])
  return !unquotedTypes.has(t)
}

/** 解析字段定义行 */
export function parseFieldDefinitions(body: string): InsertField[] {
  return body
    .split(',')
    .map(line => line.trim())
    .filter(line => !line.startsWith('PRIMARY KEY') && !line.startsWith('PRIMARY') && !line.startsWith('CONSTRAINT') && !line.startsWith('UNIQUE') && !line.startsWith('KEY') && !line.startsWith('FOREIGN') && !line.startsWith('CHECK') && line.length > 0)
    .map(line => {
      const parts = line.split(/\s+/).filter(Boolean)
      if (parts.length < 2) return null
      const name = parts[0].replace(/"/g, '')
      const type = parts[1]
      return { name, quoted: shouldQuoteByType(type), enabled: true }
    })
    .filter((f): f is InsertField => f !== null)
}

// ============ 类型判断 ============

function formatValue(val: any, quoted: boolean): string {
  if (val === null || val === undefined || val === '') return 'NULL'
  if (typeof val === 'number' && !quoted) return String(val)
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  // 不加引号时直接返回原始值
  if (!quoted) return String(val)
  // 处理日期格式
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return `'${val}'`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

// ============ INSERT 生成（批量模式：一条 INSERT + 多值） ============

/** 生成单行值元组 `(val1, val2, ...)` */
function formatValueTuple(fields: InsertField[], row: any[]): string {
  const active = fields.map((f, i) => ({ f, v: row[i], i })).filter(x => x.f.enabled)
  return '(' + active.map(x => formatValue(x.v, x.f.quoted)).join(', ') + ')'
}

/** 生成列名部分 */
function formatColumnList(fields: InsertField[]): string {
  return fields.filter(f => f.enabled).map(f => f.name).join(', ')
}

/** 生成 PostgreSQL 批量 INSERT：INSERT INTO table (cols) VALUES (v1), (v2), ...; */
export function generatePGInsertBatch(tableName: string, fields: InsertField[], rows: any[][]): string {
  const cols = formatColumnList(fields)
  const values = rows.map(row => formatValueTuple(fields, row)).join(',\n')
  return `INSERT INTO ${tableName} (${cols})\nVALUES\n${values};`
}

/** 生成 Hive 批量 INSERT：INSERT INTO TABLE table (cols) VALUES (v1), (v2), ...; */
export function generateHiveInsertBatch(tableName: string, fields: InsertField[], rows: any[][]): string {
  const cols = formatColumnList(fields)
  const values = rows.map(row => formatValueTuple(fields, row)).join(',\n')
  return `INSERT INTO TABLE ${tableName} (${cols})\nVALUES\n${values};`
}

// ============ 单行模式（兼容旧接口） ============

export function generatePGInsert(tableName: string, fields: InsertField[], row: any[]): string {
  const active = fields.map((f, i) => ({ f, v: row[i], i })).filter(x => x.f.enabled)
  const colNames = active.map(x => x.f.name).join(', ')
  const values = active.map(x => formatValue(x.v, x.f.quoted)).join(', ')
  return `INSERT INTO ${tableName} (${colNames}) VALUES (${values});`
}

export function generateHiveInsert(tableName: string, fields: InsertField[], row: any[]): string {
  const active = fields.map((f, i) => ({ f, v: row[i], i })).filter(x => x.f.enabled)
  const colNames = active.map(x => x.f.name).join(', ')
  const values = active.map(x => formatValue(x.v, x.f.quoted)).join(', ')
  return `INSERT INTO TABLE ${tableName} (${colNames}) VALUES (${values});`
}
