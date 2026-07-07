import { useState, useCallback, useEffect } from 'react'
import dayjs from 'dayjs'
import type { MdPicker } from '../types'
import { MD_PLACEHOLDERS, MD_FORMAT, MD_STEP } from '../constants'

export interface UseMultidateReturn {
  mdPicker: MdPicker
  mdRange: [dayjs.Dayjs | null, dayjs.Dayjs | null]
  mdTemplate: string
  mdDateList: string[]
  mdResult: string
  mdCopied: boolean

  setMdPicker: (v: MdPicker) => void
  setMdRange: (r: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => void
  setMdTemplate: (v: string) => void

  handleMdGenerate: () => void
  handleMdClear: () => void
}

export function useMultidate(message: { success: (msg: string) => void; warning: (msg: string) => void }): UseMultidateReturn {
  const [mdPicker, setMdPicker] = useState<MdPicker>('date')
  const [mdRange, setMdRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])
  const [mdTemplate, setMdTemplate] = useState('')
  const [mdDateList, setMdDateList] = useState<string[]>([])
  const [mdResult, setMdResult] = useState('')
  const [mdCopied, setMdCopied] = useState(false)

  const handleMdGenerate = useCallback(() => {
    if (!mdRange[0] || !mdRange[1]) { message.warning('请选择账期范围'); return }
    if (mdRange[0].isAfter(mdRange[1])) { message.warning('开始日期不能晚于结束日期'); return }
    const placeholder = MD_PLACEHOLDERS[mdPicker]
    if (!mdTemplate.includes(placeholder)) { message.warning(`模板中需包含占位符 ${placeholder}`); return }
    const dates: string[] = []
    let current = mdRange[0]
    while (current.isBefore(mdRange[1]) || current.isSame(mdRange[1], MD_STEP[mdPicker] as any)) {
      dates.push(current.format(MD_FORMAT[mdPicker]))
      current = current.add(1, MD_STEP[mdPicker] as any)
    }
    if (dates.length === 0) { message.warning('未生成有效日期'); return }
    setMdDateList(dates)
    const result = dates.map(d => {
      let sql = mdTemplate
      // 替换所有类型的占位符
      for (const [picker, ph] of Object.entries(MD_PLACEHOLDERS)) {
        if (mdTemplate.includes(ph)) {
          const fmt = MD_FORMAT[picker]
          const dateVal = dayjs(d, MD_FORMAT[mdPicker]).format(fmt)
          sql = sql.split(ph).join(dateVal)
        }
      }
      return sql
    }).join('\n\n')
    setMdResult(result)
    setMdCopied(false)
    message.success(`已生成 ${dates.length} 条 SQL`)
  }, [mdRange, mdTemplate, mdPicker, message])

  // 模板变化时自动检测占位符类型（只往更精确的方向自动切换，不回退）
  useEffect(() => {
    if (mdTemplate.includes('${yyyyMM}') || mdTemplate.includes('{month}')) setMdPicker('month')
    else if (mdTemplate.includes('${yyyyMMdd}') || mdTemplate.includes('{date}')) setMdPicker('date')
    else if (mdTemplate.includes('${yyyy}') || mdTemplate.includes('{year}')) setMdPicker('year')
    // 无占位符匹配时不改变当前选择
  }, [mdTemplate])

  const handleMdClear = useCallback(() => {
    setMdTemplate(''); setMdResult(''); setMdDateList([])
  }, [])

  return { mdPicker, mdRange, mdTemplate, mdDateList, mdResult, mdCopied, setMdPicker, setMdRange, setMdTemplate, handleMdGenerate, handleMdClear }
}
