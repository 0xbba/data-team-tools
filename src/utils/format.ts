import dayjs from 'dayjs'

/** 解析日志中可能为JSON格式的oldValue/newValue，转为可读文本 */
export function formatLogValue(val: string | null): string {
  if (!val) return '-'
  try {
    const obj = JSON.parse(val)
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')
    }
    return String(obj)
  } catch {
    return val
  }
}

/** 生成时间戳字符串 YYYYMMDDHHmm */
export function timestamp(): string {
  return dayjs().format('YYYYMMDDHHmm')
}
