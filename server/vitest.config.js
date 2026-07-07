import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    // 串行执行（共享同一个 app 实例和数据库连接）
    singleFork: true,
    globalSetup: ['./test/setup.js'],
    testTimeout: 15000,
  },
})
