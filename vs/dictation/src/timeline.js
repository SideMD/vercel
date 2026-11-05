// Local-only VS observation ledger. No remote MM or SGPU write.
const KEY = 'side.vs.waterline.local.v1'
export function readTimeline() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(items) ? items : []
  } catch { return [] }
}
export function addTimelineEntry(kind, value, extras = {}) {
  if (typeof value !== 'string' || !value.trim()) return null
  const item = {
    id: crypto.randomUUID(),
    observedAt: new Date().toISOString(),
    kind,
    text: value.trim().slice(0, 4000),
    source: extras.source || 'pages',
    originId: extras.originId || null,
    agreed: false,
    insideout: kind === 'insideout',
  }
  const entries = readTimeline()
  const next = [...entries, item].slice(-240)
  try { localStorage.setItem(KEY, JSON.stringify(next)) }
  catch { return null }
  window.dispatchEvent(new Event('vs:timeline'))
  return item
}
export function setTimelineClass(id, classification) {
  const current = readTimeline()
  const next = current.map(item => item.id !== id ? item :
    { ...item, agreed: classification === 'agreed' ? !item.agreed : item.agreed,
      insideout: classification === 'insideout' ? !item.insideout : item.insideout })
  try { localStorage.setItem(KEY, JSON.stringify(next)) }
  catch { return false }
  window.dispatchEvent(new Event('vs:timeline'))
  return true
}
