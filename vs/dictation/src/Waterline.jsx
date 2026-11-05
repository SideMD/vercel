import { useEffect, useMemo, useState } from 'react'
import { SOURCES, sourceLink } from './sources'
import { readTimeline, setTimelineClass } from './timeline'
import {
  ATL_MONTHS, LISTS, ROOT_SIDE, collectRecords, readSideState, changeSideState,
  onSideChange, belongsToSide, classFor, selectRecords, timeGroups, atlGroups,
} from './sides'
import './waterline.css'

function timeLabel(record) {
  if (!record.date) return 'Time unknown'
  const date = record.precision === 'month' ? record.date + '-01' : record.date.slice(0, 10)
  const parts = date.split('-').map(Number)
  const valid = parts.length === 3 && parts.every(Number.isInteger)
  if (!valid) return record.date
  const dateString = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric',
      ...(record.precision !== 'month' ? { day: 'numeric' } : {}), timeZone: 'UTC' })
  if (record.precision === 'second') {
    const clock = new Date(record.date)
    if (!Number.isNaN(clock.getTime())) {
      return dateString + ' · ' + clock.toLocaleTimeString('en-US',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  }
  return dateString
}
function timeGroupLabel(key) {
  if (key === 'unknown') return 'Time not provided'
  const parts = key.split('-').map(Number)
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] || 1))
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long',
      ...(parts.length === 3 ? { day: 'numeric' } : {}), timeZone: 'UTC' })
}
function shortType(record) {
  return record.kind === 'INSIDEOUT' ? 'INSIDEOUT' :
    record.kind === 'SOURCE' ? 'Source' :
    record.kind === 'DICTATION' ? 'Dictation' : 'Edit'
}

export default function Waterline({ onOpenPages }) {
  const [entries, setEntries] = useState(readTimeline)
  const [state, setState] = useState(readSideState)
  const [sideId, setSideId] = useState(ROOT_SIDE.id)
  const [view, setView] = useState('tl')
  const [list, setList] = useState('whole')
  const [query, setQuery] = useState('')
  const [newSide, setNewSide] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedRef, setSelectedRef] = useState(null)

  useEffect(() => {
    const refreshTimeline = () => setEntries(readTimeline())
    const refreshSides = () => setState(readSideState())
    window.addEventListener('vs:timeline', refreshTimeline)
    const dispose = onSideChange(refreshSides)
    return () => {
      window.removeEventListener('vs:timeline', refreshTimeline)
      dispose()
    }
  }, [])

  const records = useMemo(() => collectRecords(SOURCES, entries), [entries])
  const shown = useMemo(() => selectRecords(records, state, sideId, list, query),
    [records, state, sideId, list, query])
  const selected = records.find(record => record.ref === selectedRef) || null
  const groups = useMemo(() => timeGroups(shown), [shown])
  const months = useMemo(() => atlGroups(shown, state), [shown, state])
  const sideName = state.sides.find(side => side.id === sideId)?.name || ROOT_SIDE.name

  function apply(action) {
    const result = changeSideState(action)
    if (result.changed) setState(result.state)
    return result
  }
  function addSide(event) {
    event.preventDefault()
    const name = newSide.trim()
    if (!name) return
    const result = apply({ type: 'create', name })
    if (result.changed) {
      setSideId(result.state.sides[result.state.sides.length - 1].id)
      setNewSide('')
      setSelectedRef(null)
      setShowCreate(false)
    }
  }
  function openSide(id) {
    setSideId(id)
    setList('whole')
    setSelectedRef(null)
  }
  function classify(value) {
    if (!selected) return
    apply({ type: 'classify', ref: selected.ref, value })
  }
  function markInsideout() {
    if (!selected || selected.original) return
    setTimelineClass(selected.ref.slice('local:'.length), 'insideout')
    setEntries(readTimeline())
  }
  function recordCard(record) {
    const category = classFor(state, record.ref)
    return (
      <button type="button" key={record.ref}
        className={'waterline-record' + (selectedRef === record.ref ? ' is-selected' : '')}
        onClick={() => setSelectedRef(record.ref)}
        aria-pressed={selectedRef === record.ref}>
        <span className="waterline-record-top">
          <span className={'record-kind' + (record.insideout ? ' blue' : '')}>{shortType(record)}</span>
          <span className="record-time">{timeLabel(record)}</span>
        </span>
        <strong>{record.title}</strong>
        <span className="record-origin">{record.original ? record.detail : 'Pages · Local'}</span>
        <span className="record-status">{category === 'pending' ? 'Unsorted' : category.toUpperCase()}
          {state.atl[record.ref] ? ' · ATL ' + ATL_MONTHS[state.atl[record.ref] - 1] : ''}</span>
      </button>
    )
  }
  return (
    <main className="waterline-shell">
      <nav className="waterline-sides" aria-label="Sides">
        <div className="waterline-sides-title"><span>SIDES</span><small>{state.sides.length}</small></div>
        {state.sides.map(side => (
          <button type="button" key={side.id} className={'waterline-side' + (sideId === side.id ? ' active' : '')}
            aria-current={sideId === side.id ? 'page' : undefined} onClick={() => openSide(side.id)}>
            <span className="waterline-side-name">{side.name}</span>
            <span className="waterline-side-count">{records.filter(item => belongsToSide(state, item, side.id)).length}</span>
          </button>
        ))}
        {!showCreate ? (
          <button type="button" className="waterline-add-side" onClick={() => setShowCreate(true)}>+ New Side</button>
        ) : (
          <form className="waterline-create" onSubmit={addSide}>
            <input aria-label="New Side name" autoFocus maxLength={60} placeholder="Side name"
              value={newSide} onChange={event => setNewSide(event.target.value)} />
            <div><button type="submit" disabled={!newSide.trim()}>Create</button>
              <button type="button" onClick={() => {setShowCreate(false);setNewSide('')}}>Cancel</button></div>
          </form>
        )}
        <div className="waterline-sides-note">A Side links existing records. Sources stay in their original location.</div>
      </nav>

      <section className="waterline-main" aria-label="Waterline">
        <div className="waterline-heading">
          <div><span className="waterline-eyebrow">VS / WATERLINE</span><h1>{sideName}</h1>
            <p>Lists and time projections across the selected Side.</p></div>
          <button type="button" className="waterline-pages" onClick={onOpenPages}>Open Pages</button>
        </div>
        <div className="waterline-toolbar">
          <div className="waterline-views" role="group" aria-label="Time projection">
            <button type="button" aria-pressed={view === 'tl'} className={view === 'tl' ? 'active' : ''} onClick={() => setView('tl')}>TL</button>
            <button type="button" aria-pressed={view === 'atl'} className={view === 'atl' ? 'active' : ''} onClick={() => setView('atl')}>ATL</button>
          </div>
          <input aria-label="Find within Side" placeholder="Find a source or INSIDEOUT…" value={query} onChange={event => setQuery(event.target.value)} />
        </div>
        <nav className="waterline-lists" aria-label="Side lists">
          {LISTS.map(([id, name]) => (
            <button type="button" key={id} className={list === id ? 'active' : ''}
              aria-current={list === id ? 'page' : undefined} onClick={() => setList(id)}>{name}
              <small>{selectRecords(records, state, sideId, id).length}</small>
            </button>
          ))}
        </nav>

        {view === 'tl' ? (
          <div className="waterline-tl" aria-label="Factual timeline">
            <div className="waterline-section-caption">TL <span>Source chronology · {shown.length} records</span></div>
            {groups.length ? groups.map(group => (
              <section key={group.key} className="waterline-day">
                <h2>{timeGroupLabel(group.key)}</h2>
                <div className="waterline-records">{group.items.map(recordCard)}</div>
              </section>
            )) : <div className="waterline-blank">No records in this Side and list yet. Select a record in SIDE and link it to a new Side.</div>}
          </div>
        ) : (
          <div className="waterline-atl" aria-label="Abstract timeline">
            <div className="waterline-section-caption">ATL <span>Abstract placement · assigned by selection, independent of TL</span></div>
            <div className="waterline-atl-grid">
              {months.map(month => (
                <button type="button" key={month.month} className={'waterline-month' +
                  (selected && state.atl[selected.ref] === month.month ? ' placed' : '')}
                  disabled={!selected || !belongsToSide(state, selected, sideId)}
                  title={selected ? 'Place selected record in ' + month.name : 'Select a record in TL first'}
                  onClick={() => selected && apply({type:'atl',ref:selected.ref,month:month.month})}>
                  <span>{month.name.slice(0,3).toUpperCase()}</span><strong>{month.items.length}</strong>
                  <small>{month.items.slice(0,2).map(item => item.title).join(' · ') || 'Open'}</small>
                </button>
              ))}
            </div>
            <div className="waterline-atl-selection">
              <strong>Unplaced</strong><span>{shown.filter(item => !state.atl[item.ref]).length}</span>
              <p>Select an item in TL, switch to ATL, and choose a month. The source time will remain unchanged.</p>
            </div>
            {shown.some(item => state.atl[item.ref]) && (
              <div className="waterline-atl-list">{shown.filter(item => state.atl[item.ref]).map(recordCard)}</div>
            )}
          </div>
        )}
      </section>

      <aside className="waterline-order" aria-label="Order">
        <div className="waterline-order-header">ORDER <span>Selection</span></div>
        {!selected ? (
          <div className="waterline-order-empty">
            <span className="waterline-empty-symbol">◫</span>
            <strong>Select a record</strong>
            <p>Open its source, organize it in Sides, and position it on ATL.</p>
          </div>
        ) : (
          <div className="waterline-order-content">
            <div className="order-eyebrow">RECORD</div>
            <h2>{selected.title}</h2>
            <div className="order-metadata">
              <span>{shortType(selected)}</span><span>{timeLabel(selected)} · {selected.precision} precision</span>
            </div>
            {selected.original ? (
              <a className="waterline-source-link" href={sourceLink(selected.source)} target="_blank" rel="noreferrer">Open original source</a>
            ) : <button type="button" className="waterline-source-link" onClick={onOpenPages}>Open Pages</button>}
            <div className="waterline-order-section">
              <div className="order-eyebrow">SIDES</div>
              <div className="waterline-side-membership">
                {state.sides.map(side => (
                  <button type="button" key={side.id} disabled={side.id === ROOT_SIDE.id}
                    className={belongsToSide(state, selected, side.id) ? 'linked' : ''}
                    onClick={() => apply({ type: 'link', ref: selected.ref, sideId: side.id })}>
                    {belongsToSide(state, selected, side.id) ? '✓ ' : '+ '}{side.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="waterline-order-section">
              <div className="order-eyebrow">LIST</div>
              <div className="waterline-classify">
                {['pending', 'intra', 'extra'].map(category => (
                  <button type="button" key={category} className={classFor(state, selected.ref) === category ? 'active' : ''}
                    onClick={() => classify(category)}>{category.toUpperCase()}</button>
                ))}
              </div>
              {!selected.original && <button type="button" className="waterline-mark"
                onClick={markInsideout}>{selected.insideout ? 'Unmark INSIDEOUT' : 'Mark INSIDEOUT'}</button>}
            </div>
            <div className="waterline-order-section">
              <label className="order-eyebrow" htmlFor="waterline-month-select">ATL POSITION</label>
              <select id="waterline-month-select" value={state.atl[selected.ref] || ''}
                onChange={event => apply({type:'atl',ref:selected.ref,month:event.target.value ? Number(event.target.value) : null})}>
                <option value="">Unassigned</option>
                {ATL_MONTHS.map((name,index)=><option key={name} value={index+1}>{name}</option>)}
              </select>
              <p>TL and the original document are not changed by ATL placement.</p>
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}
