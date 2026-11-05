import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ROOT_SIDE, STORE_KEY, ATL_MONTHS, collectRecords, readSideState, changeSideState,
  belongsToSide, classFor, listFor, selectRecords, timeGroups, atlGroups,
} from '../src/sides.js'

function memory() {
  const map = new Map()
  return {
    getItem(key) { return map.get(key) ?? null },
    setItem(key, value) { map.set(key, value) },
  }
}
const source = [
  { id: 'old', kind: 'INSIDEOUT', date: '2026-10', title: 'October',
    origin: 'archival source', terms: ['old'] },
  { id: 'day', kind: 'SOURCE', date: '2026-11-05', title: 'November',
    origin: 'human source', terms: ['waterline'] },
]
const local = [
  { id: 'fixture-1', kind: 'dictation', observedAt: '2026-11-05T06:00:13-03:00',
    text: 'A real local transcription', insideout: false },
]
test('Side catalog has a root and never invents entries from a missing store', () => {
  const store = memory()
  const state = readSideState(store)
  assert.deepEqual(state.sides, [ROOT_SIDE])
  assert.deepEqual(state.links, {})
  assert.deepEqual(state.classes, {})
  assert.deepEqual(state.atl, {})
})
test('one immutable source reference can appear in several Sides without duplication', () => {
  const store = memory()
  const a = changeSideState({ type: 'create', name: 'Synapse', id: 'fixture-a' }, store).state
  const b = changeSideState({ type: 'create', name: 'Preon', id: 'fixture-b' }, store).state
  assert.equal(a.sides.length, 2)
  assert.equal(b.sides.length, 3)
  assert.equal(changeSideState({ type: 'create', name: 'synapse', id: 'again' }, store).changed, false)
  changeSideState({ type: 'link', ref: 'src:old', sideId: 'side:fixture-a' }, store)
  changeSideState({ type: 'link', ref: 'src:old', sideId: 'side:fixture-b' }, store)
  const state = readSideState(store)
  const record = collectRecords(source, local)[0]
  assert.ok(belongsToSide(state, record, ROOT_SIDE.id))
  assert.ok(belongsToSide(state, record, 'side:fixture-a'))
  assert.ok(belongsToSide(state, record, 'side:fixture-b'))
  assert.equal(state.links['src:old'].length, 2)
  changeSideState({ type: 'link', ref: 'src:old', sideId: 'side:fixture-a' }, store)
  assert.ok(!belongsToSide(readSideState(store), record, 'side:fixture-a'))
  assert.ok(belongsToSide(readSideState(store), record, 'side:fixture-b'))
})
test('INTRA / EXTRA / Pending are reversible projections without mutating source content', () => {
  const store = memory()
  const initial = collectRecords(source, local)
  const ref = initial[0].ref
  assert.equal(classFor(readSideState(store), ref), 'pending')
  assert.equal(changeSideState({type:'classify',ref,value:'intra'},store).changed, true)
  assert.equal(classFor(readSideState(store), ref), 'intra')
  assert.equal(selectRecords(initial,readSideState(store),'side','intra').length, 1)
  assert.equal(selectRecords(initial,readSideState(store),'side','extra').length, 0)
  changeSideState({type:'classify',ref,value:'extra'},store)
  assert.equal(classFor(readSideState(store), ref), 'extra')
  changeSideState({type:'classify',ref,value:'pending'},store)
  assert.equal(classFor(readSideState(store), ref), 'pending')
  assert.equal(initial[0].source.title, source[0].title)
  assert.ok(!readSideState(store).classes[ref])
})
test('TL precision is preserved; local second, archival day and archival month are separate', () => {
  const records = collectRecords(source, local)
  assert.equal(records[0].precision, 'month')
  assert.equal(records[0].date, '2026-10')
  assert.equal(records[1].precision, 'day')
  assert.equal(records[1].date, '2026-11-05')
  assert.equal(records[2].precision, 'second')
  const sorted = selectRecords(records,readSideState(memory()),'side','whole')
  const groups = timeGroups(sorted)
  assert.equal(groups[0].key, '2026-11-05')
  assert.equal(groups[0].items.length, 2)
  assert.equal(groups[1].key, '2026-10')
})
test('ATL placement never overwrites the factual TL or assigns by date', () => {
  const store = memory()
  const ref = 'src:old'
  const records = collectRecords(source,local)
  assert.equal(atlGroups(records,readSideState(store)).reduce((n,b)=>n+b.items.length,0),0)
  changeSideState({type:'atl',ref,month:10},store)
  const state = readSideState(store)
  assert.equal(ATL_MONTHS[state.atl[ref]-1],'October')
  assert.equal(atlGroups(records,state)[9].items[0].ref,ref)
  assert.equal(records[0].date,'2026-10')
  assert.equal(changeSideState({type:'atl',ref,month:13},store).changed,false)
  changeSideState({type:'atl',ref,month:null},store)
  assert.deepEqual(readSideState(store).atl,{})
})
test('Malformed persisted state and unsafe identifiers are rejected', () => {
  const store = memory()
  store.setItem(STORE_KEY,'{"sides":[{"id":"side:ok","name":"My Side"},{"id":"bad","name":"Bad"}],"links":{"src:old":["side:ok","unknown"]},"classes":{"src:old":"extra","src:evil!":"intra"},"atl":{"src:old":12,"src:bad":99}}')
  const state = readSideState(store)
  assert.equal(state.sides.length,2)
  assert.deepEqual(state.links['src:old'],['side:ok'])
  assert.deepEqual(state.classes,{'src:old':'extra'})
  assert.deepEqual(state.atl,{'src:old':12})
})
test('INSIDEOUT lists do not mislabel ordinary documents as INSIDEOUTs', () => {
  const store = memory()
  const records=collectRecords(source,local)
  assert.equal(records.filter(x=>listFor(readSideState(store),x,'insideouts')).length,1)
  assert.equal(selectRecords(records,readSideState(store),'side','pending').length,3)
})
