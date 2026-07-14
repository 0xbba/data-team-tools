// Background service worker

// 点击扩展图标 → 打开侧边栏
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})

// 监听来自content script的消息（打开侧边栏）
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'OPEN_SIDE_PANEL') {
    // 从content script发来的消息，有用户手势上下文
    const tabId = sender.tab?.id
    if (tabId) {
      chrome.sidePanel.open({ tabId }).catch(() => {})
    }
  }
})

// 监听标签页更新，在目标OA页面时更新图标提示
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (tab.url?.includes('scitsmpro.paas.sc.ctc.com/aiops/app/form/')) {
    chrome.action.setBadgeText({ text: 'OA', tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#1677ff', tabId })
  } else {
    chrome.action.setBadgeText({ text: '', tabId })
  }
})
