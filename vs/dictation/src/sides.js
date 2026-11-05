/**
 * Side-level view state. One source reference may belong to several Sides,
 * without copying or changing the original document.
 *
 * All mutations are local UI projections. The SIDE service remains the
 * authority for shared MM, source revisions, and remote permissions.
 */
export const ROOT_SIDE = Object.freeze({ id: 'side', name: 'SIDE' })
export const SIDE_EVENT = 'vs:sides'
export const STORE_KEY = 'side.vs.sides.v1'
export const ATL_MONTHS = Object.freeze([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
])
export const LISTS = Object.freeze([
  ['whole', 'Whole'], ['intra', 'INTRA'], ['extra', 'EXTRA'],
  ['insideouts', 'INSIDEOUTs'], ['pending', 'Pending'],
])

const VALID = new Set(['pending', 'intra', 'extra'])

function emptyState() {
  return { version: 1, sides: [{ ...ROOT_SIDE }], links: {}, classes: {}, atl: {} }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function cleanName(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 60) : ''
}
function cleanState(raw) {
  const state = emptyState()
  if (!isObject(raw)) return state
  if (Array.isArray(raw.sides)) {
    const known = new Set([ROOT_SIDE.id])
    for (const side of raw.sides) {
      if (!isObject(side) || typeof side.id !== 'string' || !/^side:[\w-]+$/.test(side.id)) continue
      const name = cleanName(side.name)
      if (!name || known.has(side.id) || state.sides.some(item => item.name.toLowerCase() === name.toLowerCase())) continue
      state.sides.push({ id: side.id, name })
      known.add(side.id)
    }
  }
  for (const [key, ids] of Object.entries(isObject(raw.links) ? raw.links : {})) {
    if (!/^(src|local):[\w-]+$/.test(key) || !Array.isArray(ids)) continue
    const unique = [...new Set(ids.filter(id => state.sides.some(side => side.id === id && id !== ROOT_SIDE.id)))]
    if (unique.length) state.links[key] = unique
  }
  for (const [key, value] of Object.entries(isObject(raw.classes) ? raw.classes : {})) {
    if (/^(src|local):[\w-]+$/.test(key) && VALID.has(value) && value !== 'pending') state.classes[key] = value
  }
  for (const [key, value] of Object.entries(isObject(raw.atl) ? raw.atl : {})) {
    if (/^(src|local):[\w-]+$/.test(key) && Number.isInteger(value) && value >= 1 && value <= 12) state.atl[key] = value
  }
  return state
}
export function readSideState(storage = globalThis.localStorage) {
  if (!storage) return emptyState()
  try { return cleanState(JSON.parse(storage.getItem(STORE_KEY) || 'null')) }
  catch { return emptyState() }
}
export function changeSideState(action, storage = globalThis.localStorage) {
  const state = readSideState(storage)
  if (!isObject(action)) return { state, changed: false }
  let changed = false
  const ref = typeof action.ref === 'string' && /^(src|local):[\w-]+$/.test(action.ref) ? action.ref : ''
  if (action.type === 'create') {
    const name = cleanName(action.name)
    if (name && !state.sides.some(side => side.name.toLowerCase() === name.toLowerCase())) {
      const id = 'side:' + (action.id || globalThis.crypto.randomUUID())
      if (/^side:[\w-]+$/.test(id) && !state.sides.some(side => side.id === id)) {
        state.sides.push({ id, name })
        changed = true
      }
    }
  } else if (action.type === 'link' && ref) {
    const id = action.sideId
    if (id !== ROOT_SIDE.id && state.sides.some(side => side.id === id)) {
      const linked = new Set(state.links[ref] || [])
      if (linked.has(id)) linked.delete(id)
      else linked.add(id)
      if (linked.size) state.links[ref] = [...linked]
      else delete state.links[ref]
      changed = true
    }
  } else if (action.type === 'classify' && ref && VALID.has(action.value)) {
    const previous = state.classes[ref] || 'pending'
    if (previous !== action.value) {
      if (action.value === 'pending') delete state.classes[ref]
      else state.classes[ref] = action.value
      changed = true
    }
  } else if (action.type === 'atl' && ref && (action.month === null ||
      (Number.isInteger(action.month) && action.month >= 1 && action.month <= 12))) {
    const previous = state.atl[ref] || null
    if (previous !== action.month) {
      if (action.month === null) delete state.atl[ref]
      else state.atl[ref] = action.month
      changed = true
    }
  }
  if (changed && storage) {
    try {
      storage.setItem(STORE_KEY, JSON.stringify(state))
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(SIDE_EVENT))
    } catch { return { state: readSideState(storage), changed: false } }
  }
  return { state, changed }
}
export function onSideChange(listener) {
  if (typeof window === 'undefined') return () => {}
  const fromStorage = event => { if (event.key === STORE_KEY) listener() }
  window.addEventListener('storage', fromStorage)
  window.addEventListener(SIDE_EVENT, listener)
  return () => {
    window.removeEventListener('storage', fromStorage)
    window.removeEventListener(SIDE_EVENT, listener)
  }
}

/** Records are display projections. No content or timestamp is invented. */
export function collectRecords(sources, timeline) {
  const historical = sources.map(item => {
    const originalDate = typeof item.date === 'string' ? item.date : ''
    const date = /^\d{4}-\d{2}(-\d{2})?$/.test(originalDate) ? originalDate : ''
    return {
      ref: 'src:' + item.id, kind: item.kind === 'INSIDEOUT' ? 'INSIDEOUT' : 'SOURCE',
      title: item.title, detail: item.origin, date, precision: date.length === 10 ? 'day' : date ? 'month' : 'unknown',
      source: item, original: true, insideout: item.kind === 'INSIDEOUT',
      text: [item.title, item.origin, ...(item.terms || [])].join(' '),
    }
  })
  const events = timeline.filter(entry => isObject(entry) && typeof entry.id === 'string' &&
    /^(?:[\w-]+)$/.test(entry.id) && typeof entry.text === 'string').map(entry => {
    const stamp = typeof entry.observedAt === 'string' && !Number.isNaN(Date.parse(entry.observedAt))
      ? entry.observedAt : ''
    return {
      ref: 'local:' + entry.id, kind: entry.insideout || entry.kind === 'insideout' ? 'INSIDEOUT' :
        entry.kind === 'dictation' ? 'DICTATION' : 'EDIT',
      title: entry.text.trim().slice(0, 98) || 'Untitled',
      detail: entry.text, date: stamp, precision: stamp ? 'second' : 'unknown',
      original: false, source: null, insideout: Boolean(entry.insideout || entry.kind === 'insideout'),
      text: entry.text,
    }
  })
  return [...historical, ...events]
}
export function classFor(state, ref) {
  return state.classes[ref] || 'pending'
}
export function belongsToSide(state, record, sideId) {
  return sideId === ROOT_SIDE.id || Boolean(state.links[record.ref]?.includes(sideId))
}
export function listFor(state, record, list) {
  if (list === 'whole') return true
  if (list === 'insideouts') return record.insideout
  return classFor(state, record.ref) === list
}
export function selectRecords(records, state, sideId, list, query = '') {
  const needle = String(query).trim().toLocaleLowerCase('en')
  return records.filter(record =>
    belongsToSide(state, record, sideId) && listFor(state, record, list) &&
    (!needle || record.text.toLocaleLowerCase('en').includes(needle))
  ).sort((a,b) => (b.date || '').localeCompare(a.date || '') || a.ref.localeCompare(b.ref))
}
export function timeGroups(records) {
  const groups = new Map()
  for (const record of records) {
    const date = record.date || ''
    const key = record.precision === 'second' ? date.slice(0,10) :
      record.precision === 'day' ? date : record.precision === 'month' ? date : 'unknown'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(record)
  }
  return [...groups].map(([key, items]) => ({ key, items }))
}
export function atlGroups(records, state) {
  return ATL_MONTHS.map((name, index) => ({
    month: index + 1, name,
    items: records.filter(item => state.atl[item.ref] === index + 1),
  }))
}
