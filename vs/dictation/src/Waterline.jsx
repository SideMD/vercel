import { useEffect, useMemo, useState } from 'react'
import { SOURCES, sourceLink } from './sources'
import { readTimeline, setTimelineClass } from './timeline'
import './waterline.css'

const MODES = [
  ['all', 'All'], ['human', 'Human'], ['agreement', 'Agreed'],
  ['insideout', 'INSIDEOUTs'], ['outside', 'Outside'], ['cells', 'Cells'],
]

function sourceType(entry) {
  return entry.kind === 'insideout' || entry.insideout ? 'INSIDEOUT' : entry.kind === 'dictation' ? 'Dictation' : 'Typing'
}

export default function Waterline({ onOpenPages }) {
  const [entries, setEntries] = useState(readTimeline)
  const [mode, setMode] = useState('all')
  const [query, setQuery] = useState('')
  useEffect(() => {
    const refresh = () => setEntries(readTimeline())
    window.addEventListener('vs:timeline', refresh)
    return () => window.removeEventListener('vs:timeline', refresh)
  }, [])
  const matching = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return [...entries].reverse().filter(item => {
      const pass = mode === 'all' || mode === 'human' && item.kind !== 'insideout' ||
        mode === 'agreement' && item.agreed || mode === 'insideout' && item.insideout ||
        mode === 'outside' && !item.insideout && !item.agreed
      return pass && (!q || item.text.toLocaleLowerCase('pt-BR').includes(q))
    })
  }, [entries, mode, query])
  const cells = SOURCES.filter(item => !query.trim() ||
    [item.title, item.origin, ...item.terms].join(' ').toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')))
  return (
    <main className="waterline-surface">
      <header className="waterline-heading">
        <div><div className="waterline-kicker">VS / WTL</div><h1>Waterline</h1>
          <p>Sources, text and INSIDEOUTs. Local entries appear after you edit or dictate in Pages.</p>
        </div>
        <button type="button" onClick={onOpenPages}>Open Pages</button>
      </header>
      <div className="waterline-tools">
        <div className="waterline-modes" role="group" aria-label="Filter Waterline">
          {MODES.map(([id,label]) => <button key={id} type="button" aria-pressed={mode === id}
            className={mode === id ? 'selected' : ''} onClick={() => setMode(id)}>{label}</button>)}
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search text or cell" aria-label="Search Waterline" />
      </div>
      <div className="waterline-legend">
        <span><i className="legend-human" /> Human</span>
        <span><i className="legend-agreed" /> Agreed (manually marked)</span>
        <span><i className="legend-system" /> VS (recorded events only)</span>
      </div>
      {mode === 'cells' ? (
        <section className="waterline-cells" aria-label="Sourced cells">
          {cells.map(s => (
            <article key={s.id}>
              <div><span>{s.kind}</span><time>{s.date}</time></div>
              <h2>{s.title}</h2>
              <p>{s.origin}</p>
              <a href={sourceLink(s)} target="_blank" rel="noreferrer">Open versioned source</a>
            </article>
          ))}
        </section>
      ) : (
        <section className="waterline-messages" aria-label="Local Waterline events">
          {matching.length === 0 && <div className="waterline-empty">
            No local events match this view. Waterline does not invent messages or import conversations without source evidence.
          </div>}
          {matching.map(item => (
            <article key={item.id} className={'waterline-event' + (item.agreed ? ' agreed' : '')}>
              <div className="waterline-event-meta">
                <span>{sourceType(item)} · Human</span><time>{new Date(item.observedAt).toLocaleString('pt-BR')}</time>
              </div>
              <p>{item.text}</p>
              <div className="waterline-event-actions">
                <button type="button" onClick={() => setTimelineClass(item.id, 'agreed')}>
                  {item.agreed ? 'Unmark agreement' : 'Mark agreed'}
                </button>
                <button type="button" onClick={() => setTimelineClass(item.id, 'insideout')}>
                  {item.insideout ? 'Unmark INSIDEOUT' : 'Mark INSIDEOUT'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      <footer className="waterline-provenance">Local WTL · Not synchronized with MM. Conversation events and AI responses require authorized sources and adapters.</footer>
    </main>
  )
}
