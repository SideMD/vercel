import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import './notes.css'

const STORE = 'side.vs.notes.v1'
const MAX_NOTES = 250

function readNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE) || '[]')
    return Array.isArray(parsed) ? parsed.filter(item =>
      item && typeof item.id === 'string' && typeof item.markdown === 'string'
    ).slice(0, MAX_NOTES) : []
  } catch { return [] }
}
function writeNotes(items) {
  localStorage.setItem(STORE, JSON.stringify(items))
}
function noteName(markdown) {
  const heading = markdown.match(/^\s*#{1,3}\s+(.+)$/m)?.[1]
  const sentence = markdown.split('\n').find(line => line.trim())?.replace(/^[#>\s-]+/, '')
  return (heading || sentence || 'Untitled Note').trim().slice(0, 72) || 'Untitled Note'
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not dated' : date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function Notes({ onOpenPages, onOpenFinder }) {
  const [items, setItems] = useState(readNotes)
  const [selectedId, setSelectedId] = useState(() => readNotes()[0]?.id || null)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const editingId = useRef(selectedId)
  const switching = useRef(false)
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: '',
    contentType: 'markdown',
    editable: true,
    onUpdate: ({editor: current}) => {
      if (switching.current || !editingId.current) return
      const markdown = current.getMarkdown()
      try {
        const currentNotes = readNotes()
        const updated = currentNotes.map(item => item.id !== editingId.current ? item : {
          ...item, markdown, title: noteName(markdown), updatedAt: new Date().toISOString(),
        })
        writeNotes(updated)
        setItems(updated)
        setMessage('Saved on this device')
      } catch {
        setMessage('Storage is full. Export the note as Markdown.')
      }
    },
  })
  useEffect(() => {
    if (!editor) return
    const selected = items.find(item => item.id === selectedId)
    editingId.current = selectedId
    switching.current = true
    editor.commands.setContent(selected?.markdown || '', {contentType:'markdown'})
    editor.setEditable(Boolean(selected))
    switching.current = false
  }, [editor, selectedId])

  function create() {
    const existing = readNotes()
    if (existing.length >= MAX_NOTES) {
      setMessage('The local Notes collection is full. Export or delete a note.')
      return
    }
    const item = {
      id: crypto.randomUUID(), title: 'Untitled Note', markdown: '# Untitled Note\n\n',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    try {
      const next = [item, ...existing]
      writeNotes(next)
      setItems(next)
      setSelectedId(item.id)
      setMessage('New note')
      requestAnimationFrame(() => editor?.commands.focus('end'))
    } catch { setMessage('Could not save the new note.') }
  }
  function remove() {
    if (!selectedId || !window.confirm('Delete this note from this device?')) return
    try {
      const next = readNotes().filter(item => item.id !== selectedId)
      writeNotes(next)
      setItems(next)
      setSelectedId(next[0]?.id || null)
      setMessage('Note deleted')
    } catch { setMessage('Could not delete note.') }
  }
  function exportNote() {
    const item = items.find(item => item.id === selectedId)
    if (!item) return
    const markdown = editor?.getMarkdown() || item.markdown
    const blob = new Blob([markdown], {type:'text/markdown;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (noteName(markdown).replace(/[^a-z0-9 _-]/gi,'').replace(/\s+/g,'-') || 'note') + '.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Markdown exported')
  }
  const selected = items.find(item => item.id === selectedId)
  const filtered = items.filter(item =>
    [item.title, item.markdown].join(' ').toLowerCase().includes(query.toLowerCase())
  ).sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))

  return (
    <main className="vs-notes">
      <aside className="notes-list" aria-label="Notes library">
        <header><small>VS / NOTES</small><h1>Notes</h1>
          <button type="button" className="notes-add" onClick={create}>+ New Note</button>
        </header>
        <input aria-label="Search notes" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search notes…" className="notes-search" />
        <div className="notes-items">
          {filtered.map(item => <button type="button" key={item.id}
            className={'notes-item' + (item.id === selectedId ? ' selected' : '')}
            onClick={() => setSelectedId(item.id)}>
            <strong>{item.title}</strong><span>{formatDate(item.updatedAt)}</span>
          </button>)}
          {!filtered.length && <p className="notes-empty">{items.length ? 'No matching notes.' : 'Create your first note.'}</p>}
        </div>
      </aside>
      <section className="notes-editor-area" aria-label="Note editor">
        <header className="notes-editor-header">
          <div><small>LOCAL DOCUMENT</small><strong>{selected?.title || 'No note selected'}</strong></div>
          <div className="notes-buttons">
            <button type="button" disabled={!selected} onClick={exportNote}>Save MD</button>
            <button type="button" disabled={!selected} onClick={remove}>Delete</button>
          </div>
        </header>
        {selected ? <EditorContent editor={editor} className="notes-prosemirror" /> :
          <div className="notes-intro">
            <h2>Write in Notes</h2><p>Markdown editing, a local note library, and direct export.</p>
            <button type="button" onClick={create}>Create Note</button>
          </div>}
        <footer className="notes-footer">
          <span role="status">{message || 'Notes saved automatically in this workspace'}</span>
          <span>⌘ Z to undo</span>
        </footer>
      </section>
    </main>
  )
}
