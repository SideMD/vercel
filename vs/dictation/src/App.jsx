import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { closeHistory } from '@tiptap/pm/history'
import sideLogo from '../../images/logo/dominio/sideMD-sem-ponto-transparente.svg'
import FinderColumns from './FinderColumns.jsx'
import Waterline from './Waterline.jsx'
import InsideoutReader from './InsideoutReader.jsx'
import { addTimelineEntry } from './timeline'
import './columns.css'

const DOCUMENT_KEY = 'side.vs.dictation.document.md.v1'
const TRANSCRIBE_URL = (import.meta.env.VITE_DICTATION_TRANSCRIBE_URL || '').trim()
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const DEFAULT_DOCUMENT = '# INSIDEOUT\n\nClick where you want to write. Tap the microphone in the top bar, speak, then press Stop to insert your words at the cursor.\n'

function openAudioStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('side-dictation-audio-v1', 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('clips')) {
        request.result.createObjectStore('clips', { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function preserveAudio(blob) {
  const db = await openAudioStore()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('clips', 'readwrite')
      tx.objectStore('clips').put({
        id: crypto.randomUUID(), blob, mime: blob.type,
        createdAt: new Date().toISOString(),
      })
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0')
  const seconds = (value % 60).toString().padStart(2, '0')
  return minutes + ':' + seconds
}

export default function App() {
  const [dockOpen, setDockOpen] = useState(false)
  const [reading, setReading] = useState(null)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [surface, setSurface] = useState(() => window.location.hash === '#waterline' ? 'waterline' : window.location.hash === '#pages' ? 'pages' : window.location.hash === '#finder' ? 'finder' : window.__TAURI_INTERNALS__ ? 'pages' : 'finder')
  const [status, setStatus] = useState('')
  const [failure, setFailure] = useState('')

  const fileRef = useRef(null)
  const editTimerRef = useRef(null)
  const insertionPointRef = useRef({ from: 1, to: 1 })
  const recordingRef = useRef(false)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startedRef = useRef(0)
  const recognizerRef = useRef(null)
  const speechTextRef = useRef('')
  const speechFinalRef = useRef('')
  const speechInterimRef = useRef('')
  const speechEndRef = useRef(null)
  const speechResolverRef = useRef(null)
  const canvasRef = useRef(null)
  const waveFrameRef = useRef(null)
  const contextRef = useRef(null)

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: (() => {
      try { return localStorage.getItem(DOCUMENT_KEY) || DEFAULT_DOCUMENT }
      catch { return DEFAULT_DOCUMENT }
    })(),
    contentType: 'markdown',
    onUpdate: ({ editor: current }) => {
      try { localStorage.setItem(DOCUMENT_KEY, current.getMarkdown()) }
      catch { /* storage may be disabled */ }
      if (editTimerRef.current) clearTimeout(editTimerRef.current)
      editTimerRef.current = setTimeout(() => {
        const excerpt = current.getText().trim()
        if (excerpt) addTimelineEntry('edit', excerpt.slice(-350), { source: 'pages' })
      }, 1400)
    },
  })

  useEffect(() => () => { if (editTimerRef.current) clearTimeout(editTimerRef.current) }, [])

  useEffect(() => {
    const onHash = () => setSurface(window.location.hash === '#waterline' ? 'waterline' : window.location.hash === '#pages' ? 'pages' : window.location.hash === '#finder' ? 'finder' : window.__TAURI_INTERNALS__ ? 'pages' : 'finder')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function openSurface(next) {
    if (recordingRef.current || processing) return
    window.location.hash = next === 'waterline' ? 'waterline' : next === 'finder' ? 'finder' : 'pages'
    setSurface(next)
    setDockOpen(false)
  }

  useEffect(() => {
    if (!editor) return
    const onSelection = () => {
      if (!editor.isFocused) return
      const { from, to } = editor.state.selection
      insertionPointRef.current = { from, to }
    }
    const onTransaction = ({ transaction }) => {
      if (!transaction.docChanged) return
      const { from, to } = insertionPointRef.current
      const next = { from: transaction.mapping.map(from, -1), to: transaction.mapping.map(to, 1) }
      insertionPointRef.current = next
    }
    editor.on('selectionUpdate', onSelection)
    editor.on('transaction', onTransaction)
    return () => {
      editor.off('selectionUpdate', onSelection)
      editor.off('transaction', onTransaction)
    }
  }, [editor])

  useEffect(() => {
    const interval = setInterval(() => {
      if (recordingRef.current) {
        setSeconds(Math.floor((Date.now() - startedRef.current) / 1000))
      }
    }, 250)
    return () => clearInterval(interval)
  }, [])

  const stopWave = useCallback(() => {
    if (waveFrameRef.current) cancelAnimationFrame(waveFrameRef.current)
    waveFrameRef.current = null
    if (contextRef.current) contextRef.current.close().catch(() => {})
    contextRef.current = null
  }, [])

  useEffect(() => {
    if (!recording || !streamRef.current || !canvasRef.current) return
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    contextRef.current = context
    const source = context.createMediaStreamSource(streamRef.current)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.55
    source.connect(analyser)
    const bins = new Uint8Array(analyser.frequencyBinCount)
    const draw = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      analyser.getByteFrequencyData(bins)
      const count = 48
      const step = canvas.width / count
      for (let i = 0; i < count; i++) {
        const level = bins[Math.floor(i * bins.length / count)] / 255
        const height = Math.max(2, level * level * canvas.height * 1.6)
        ctx.fillStyle = '#0D80BF'
        ctx.fillRect(i * step + 1, (canvas.height - height) / 2, Math.max(2, step - 3), height)
      }
      waveFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return stopWave
  }, [recording, stopWave])

  useEffect(() => () => {
    recordingRef.current = false
    try { recognizerRef.current?.abort() } catch { /* may already be stopped */ }
    try { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }
    catch { /* may already be stopped */ }
    streamRef.current?.getTracks().forEach(track => track.stop())
    stopWave()
  }, [stopWave])

  function insertAtNeedle(text) {
    if (!editor || !text.trim()) {
      setFailure('No words recognized. Original audio was retained locally.')
      return false
    }
    const max = editor.state.doc.content.size
    const from = Math.max(1, Math.min(insertionPointRef.current.from, max))
    const to = Math.max(from, Math.min(insertionPointRef.current.to, max))
    const point = editor.state.doc.resolve(from)
    const before = point.nodeBefore?.text?.slice(-1) || ''
    const after = point.nodeAfter?.text?.slice(0, 1) || ''
    const value = (before && !/\s/.test(before) ? ' ' : '') + text.trim() +
      (after && !/\s/.test(after) ? ' ' : '')

    // Keep the voice insertion as a discrete undo step: Cmd/Ctrl+Z.
    editor.view.dispatch(closeHistory(editor.state.tr))
    editor.chain().focus().insertContentAt({ from, to }, value, { updateSelection: true }).run()
    editor.view.dispatch(closeHistory(editor.state.tr))
    insertionPointRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    }
    setFailure('')
    addTimelineEntry('dictation', text, { source: 'dictation' })
    setStatus('Dictation inserted. Press ⌘ Z or Ctrl Z to undo.')
    return true
  }

  async function transcribeLocally(blob) {
    const response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'application/octet-stream' },
      body: blob,
    })
    if (!response.ok) {
      let detail = ''
      try { detail = (await response.json()).error || '' } catch { /* ignore invalid error payload */ }
      throw new Error(detail || 'HTTP ' + response.status)
    }
    const data = await response.json()
    if (typeof data.text !== 'string') throw new Error('No transcription text returned')
    return data.text.trim()
  }

  function newBrowserRecognizer() {
    if (!SpeechRecognition) return null
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = event => {
      let confirmed = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const value = event.results[i][0]?.transcript?.trim() || ''
        if (event.results[i].isFinal) confirmed += value + ' '
        else interim += value + ' '
      }
      speechFinalRef.current = confirmed.trim()
      speechInterimRef.current = interim.trim()
    }
    recognition.onend = () => {
      const segment = [speechFinalRef.current, speechInterimRef.current]
        .filter(Boolean).join(' ').trim()
      if (segment) speechTextRef.current = [speechTextRef.current, segment]
        .filter(Boolean).join(' ').trim()
      speechFinalRef.current = ''
      speechInterimRef.current = ''
      if (!recordingRef.current) {
        speechResolverRef.current?.()
        speechResolverRef.current = null
      } else {
        setTimeout(() => {
          if (recordingRef.current) {
            try { recognition.start() }
            catch { setFailure('Browser speech recognition stopped.') }
          }
        }, 180)
      }
    }
    recognition.onerror = event => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setFailure('Speech recognition: ' + event.error)
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
        stopRecording()
      }
    }
    return recognition
  }

  async function finishAudio(blob) {
    try {
      await preserveAudio(blob)
    } catch (error) {
      setFailure('Could not retain original audio: ' + error.message)
    }
    try {
      let text
      if (TRANSCRIBE_URL) {
        text = await transcribeLocally(blob)
      } else {
        await Promise.race([
          speechEndRef.current || Promise.resolve(),
          new Promise(resolve => setTimeout(resolve, 1500)),
        ])
        text = [speechTextRef.current, speechFinalRef.current, speechInterimRef.current]
          .filter(Boolean).join(' ').trim()
      }
      insertAtNeedle(text)
    } catch (error) {
      setFailure('Transcription failed: ' + error.message + '. Original audio remains local.')
    } finally {
      setProcessing(false)
    }
  }

  async function startRecording() {
    if (recordingRef.current || processing) return
    if (!TRANSCRIBE_URL && !SpeechRecognition) {
      setFailure('Speech recognition unavailable. On macOS, run npm run desktop.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setFailure('Microphone is unavailable in this environment.')
      return
    }
    setFailure('')
    setStatus('')
    setSeconds(0)
    speechTextRef.current = ''
    speechFinalRef.current = ''
    speechInterimRef.current = ''
    speechEndRef.current = new Promise(resolve => { speechResolverRef.current = resolve })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onerror = event => setFailure('Recording failed: ' + (event.error?.message || 'unknown error'))
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (!blob.size) {
          setProcessing(false)
          setFailure('No audio recorded.')
          return
        }
        await finishAudio(blob)
      }
      recognizerRef.current = TRANSCRIBE_URL ? null : newBrowserRecognizer()
      recordingRef.current = true
      startedRef.current = Date.now()
      recorder.start(300)
      setRecording(true)
      if (recognizerRef.current) {
        try { recognizerRef.current.start() }
        catch (error) { setFailure('Speech recognition unavailable: ' + error.message); stopRecording() }
      }
    } catch (error) {
      streamRef.current?.getTracks().forEach(track => track.stop())
      setFailure('Microphone: ' + error.message)
    }
  }

  function stopRecording() {
    if (!recordingRef.current) return
    recordingRef.current = false
    setRecording(false)
    setProcessing(true)
    try { recognizerRef.current?.stop() }
    catch { speechResolverRef.current?.() }
    try {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      else setProcessing(false)
    } catch (error) {
      setProcessing(false)
      setFailure('Stop failed: ' + error.message)
    }
  }

  function openSourceReader(source) {
    if (recordingRef.current || processing) return
    setReading({
      ref: 'src:' + source.id,
      original: true, source,
      title: source.title, kind: source.kind,
      detail: source.origin,
    })
  }

  function editFromReader(markdown) {
    if (!editor || !markdown || recordingRef.current || processing) return
    const current = editor.getMarkdown()
    if (current.trim() && current !== DEFAULT_DOCUMENT &&
      !window.confirm('Replace the current Pages document with this text?')) return
    editor.commands.setContent(markdown, { contentType: 'markdown' })
    editor.commands.focus('start')
    insertionPointRef.current = { from: 1, to: 1 }
    setReading(null)
    openSurface('pages')
    setStatus('Document loaded in Pages. Changes are saved locally.')
  }

  async function importDocument(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !editor) return
    if (!confirm('Replace the document with the selected file?')) return
    const markdown = await file.text()
    editor.commands.setContent(markdown, { contentType: 'markdown' })
    editor.commands.focus('start')
    insertionPointRef.current = { from: 1, to: 1 }
    setStatus('Markdown opened.')
  }

  function saveInsideout() {
    if (!editor) return
    const {from,to} = editor.state.selection
    const text = from !== to ? editor.state.doc.textBetween(from,to,'\n') : ''
    if (!text.trim()) {setStatus('Select a text passage to create an INSIDEOUT.');return}
    addTimelineEntry('insideout', text, {source:'pages'})
    setStatus('INSIDEOUT saved in the local Waterline.')
    setDockOpen(false)
  }

  function exportDocument() {
    if (!editor) return
    try {
      download(new Blob([editor.getMarkdown()], { type: 'text/markdown;charset=utf-8' }), 'insideout.md')
    } catch (error) { setFailure('Could not export document: ' + error.message) }
  }

  return (
    <div className="dictation-app">
      <header className="header">
        <img className="brand-logo" src={sideLogo} alt="sideMD" />
        <span className="address">VS / {surface === 'finder' ? 'Finder' : surface === 'waterline' ? 'Waterline' : 'Pages'}</span>
        <span className="header-context">SIDE / VISUALIZATION</span>
        {surface === 'pages' && <button type="button" className={'header-mic'+(recording?' recording':'')}
          disabled={recording || processing} onClick={startRecording} aria-label="Record dictation" title="Record dictation">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>
          </svg>
        </button>}
        <input type="file" ref={fileRef} hidden accept=".md,.markdown,text/plain" onChange={importDocument} />
      </header>
      {surface === 'finder' ? (
        <FinderColumns onOpenPages={() => openSurface('pages')} onOpenWaterline={() => openSurface('waterline')}
          onReadSource={openSourceReader} onReadRecord={setReading} />
      ) : surface === 'waterline' ? (
        <Waterline onOpenPages={() => openSurface('pages')} onReadRecord={setReading}/>
      ) : (
        <main className="workspace">
          <section className="document-page" aria-label="Editable document">
            <div className="document-meta"><span>DOCUMENT <strong>INSIDEOUT</strong></span><span className="cursor-position">Editable</span></div>
            <EditorContent editor={editor} className="document-editor" />
          </section>
        </main>
      )}
      {surface === 'pages' && (recording || processing) && (
        <section className={'dictation-bar' + (recording ? ' is-recording' : '')} aria-label="Dictation status">
          {recording ? (
            <>
              <span className="signal-marker" aria-hidden="true" />
              <canvas ref={canvasRef} width="340" height="38" aria-label="Live microphone waveform" />
              <span className="timer">{formatTime(seconds)}</span>
              <button type="button" className="stop-record" onClick={stopRecording} aria-label="Stop recording">
                <span className="stop-square" aria-hidden="true"/> Stop
              </button>
            </>
          ) : (
            <>
              <span className="processing-dot" aria-hidden="true"/>
              <span className="bar-message">Transcribing into document…</span>
            </>
          )}
        </section>
      )}
      <nav className={'vs-dock' + (dockOpen ? ' expanded' : '') + (surface === 'pages' ? ' with-dictation' : '')} aria-label="VS dock">
        {dockOpen && <div className="dock-buttons">
          <button type="button" disabled={recording || processing} className={surface === 'finder' ? 'selected' : ''} onClick={() => openSurface('finder')}>Finder</button>
          <button type="button" disabled={recording || processing} className={surface === 'pages' ? 'selected' : ''} onClick={() => openSurface('pages')}>Pages</button>
          <button type="button" disabled={recording || processing} className={surface === 'waterline' ? 'selected' : ''} onClick={() => openSurface('waterline')}>Waterline</button>
          {surface === 'pages' && <>
            <button type="button" disabled={recording || processing} onClick={() => {fileRef.current?.click();setDockOpen(false)}}>Open MD</button>
            <button type="button" disabled={recording || processing} onClick={() => {exportDocument();setDockOpen(false)}}>Save MD</button>
            <button type="button" disabled={recording || processing} onClick={saveInsideout}>INSIDEOUT</button>
          </>}
        </div>}
        <button type="button" className="dock-toggle" onClick={() => setDockOpen(v => !v)}
          aria-expanded={dockOpen} aria-label={dockOpen ? 'Collapse app dock' : 'Open app dock'}>
          <span className="dock-logo">S</span><span>{dockOpen ? 'Close' : 'VS'}</span>
          <span className="dock-chevron">{dockOpen ? '⌄' : '⌃'}</span>
        </button>
      </nav>
      <InsideoutReader record={reading} onClose={() => setReading(null)} onEdit={editFromReader} />
      {(failure || status) && surface === 'pages' &&
        <div role="status" className={'voice-notice' + (failure ? ' is-error' : '')}>{failure || status}</div>}
    </div>
  )
}
