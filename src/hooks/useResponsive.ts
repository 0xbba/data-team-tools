import { useState, useEffect } from 'react'

/**
 * 检测当前是否为小屏（<=768px），用于响应式 UI 切换
 */
export function useIsSmallScreen(breakpoint = 768): boolean {
  const [isSmall, setIsSmall] = useState(() => window.innerWidth <= breakpoint)
  useEffect(() => {
    const handler = () => setIsSmall(window.innerWidth <= breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isSmall
}
