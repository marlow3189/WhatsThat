// Orbifolk w przeglądarce: panel boczny (Chrome, Edge) albo karta (Safari, gdzie panelu bocznego nie ma).
const APP = 'app/index.html'
const hasPanel = typeof chrome !== 'undefined' && !!chrome.sidePanel

chrome.runtime.onInstalled.addListener(() => {
  if (hasPanel) chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
  chrome.contextMenus.create({ id: 'sell', title: chrome.i18n.getMessage('menuSell'), contexts: ['page', 'image', 'selection', 'link'] })
})

if (!hasPanel) {
  chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: chrome.runtime.getURL(APP) }))
}

// „Wystaw na Orbifolk” z dowolnej strony: tytuł, zaznaczony tekst i zdjęcie trafiają do formularza.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const params = new URLSearchParams()
  params.set('t', (info.selectionText || tab?.title || '').slice(0, 120))
  if (info.srcUrl) params.set('img', info.srcUrl)
  if (info.pageUrl) params.set('u', info.pageUrl)
  const path = `${APP}#/dodaj?${params.toString()}`
  if (hasPanel && tab?.windowId !== undefined) {
    await chrome.sidePanel.setOptions({ path, enabled: true })
    await chrome.sidePanel.open({ windowId: tab.windowId })
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL(path) })
  }
})
