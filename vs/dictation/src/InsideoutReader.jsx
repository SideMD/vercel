import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { sourceLink } from './sources'
import './reader.css'

const MAX_SIZE = 2 * 1024 * 1024

export default function InsideoutReader({ record, onClose, onEdit }) {
  const [text, setText] = useState('')
  const [filename, setFilename] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const dialogRef = useRef(null)
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    editable: false,
    content: '',
    contentType: 'markdown',
  })

  useEffect(() => {
    const next = record && !record.original ? record.detail || record.text || '' : ''
    setText(next)
    setFilename('')
    setError('')
  }, [record?.ref])
  useEffect(() => {
    if (editor) editor.commands.setContent(text, { contentType: 'markdown' })
  }, [editor, text])
  useEffect(() => {
    if (!record) return
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [record, onClose])
  if (!record) return null

  async function openFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_SIZE) {
      setError('File exceeds 2 MB. Choose a smaller Markdown document.')
      return
    }
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setError('Select a Markdown or text file.')
      return
    }
    try {
      setText(await file.text())
      setFilename(file.name)
      setError('')
    } catch {
      setError('The selected file could not be read.')
    }
  }
  const url = record.source ? sourceLink(record.source) : ''
  const title = record.title || 'INSIDEOUT'
  return (
    <div className="insideout-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="insideout-dialog" role="dialog" aria-modal="true"
        aria-label={'Read ' + title} ref={dialogRef} tabIndex={-1}>
        <header className="insideout-reader-header">
          <div className="insideout-reader-identity">
            <small>VS / INSIDEOUT READER</small>
            <h2>{title}</h2>
            <span>{record.kind || 'Source'} · {record.ref}</span>
          </div>
          <button type="button" className="insideout-close" onClick={onClose} aria-label="Close reader">×</button>
        </header>
        <div className="insideout-reader-tools">
          {url && <a href={url} target="_blank" rel="noreferrer">Original source</a>}
          <button type="button" onClick={() => fileRef.current?.click()}>Open local MD</button>
          {text && <button type="button" className="insideout-edit" onClick={() => onEdit(text)}>Edit in Pages</button>}
          <input hidden type="file" accept=".md,.markdown,.txt,text/plain" ref={fileRef} onChange={openFile}/>
        </div>
        <div className="insideout-reader-body">
          {error && <p className="insideout-reader-error" role="alert">{error}</p>}
          {text ? (
            <>
              {filename && <p className="insideout-reader-file">Local document: {filename}</p>}
              <EditorContent editor={editor} className="insideout-reader-document" />
            </>
          ) : (
            <div className="insideout-reader-placeholder">
              <strong>{record.original ? 'Source indexed' : 'No content to display'}</strong>
              <p>{record.original ?
                'Open the original GitHub source using your authorized account, or choose a local Markdown file to read it here.' :
                'Choose a Markdown file to read it in this window.'}</p>
              {record.source?.path && <code>{record.source.path}</code>}
            </div>
          )}
        </div>
        <footer className="insideout-reader-footer">
          <span>{record.original ? 'Versioned source reference' : 'Local text'}</span>
          <span>Esc to close · Read-only until Edit in Pages</span>
        </footer>
      </section>
    </div>
  )
}
