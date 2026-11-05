import { useMemo, useRef, useState } from 'react'
import sideSymbol from '../../images/logo/simbolo/azul/simbolo-transparente.svg'
import { SOURCES, sourceLink } from './sources'
import './columns.css'

const TREE = {
  SIDE: ['VS','SID','Technology','Greek','Phoenician','Other'],
  VS: ['Finder','Pages','Dictation','Images','Waterline'],
  SID: ['SI','SGPU','Relay'],
  Technology: ['Software','Interface'],
  Greek: ['October','INSIDEOUTs','Constellation'],
  Phoenician: ['Photon','Graviton'],
  Other: ['Transcripts','History'],
  SI: ['S'],
  Relay: ['VS relay','MM relay','SGPU relay'],
  Software: ['Registry','Dictionary'],
  Interface: ['VS runtimes'],
  October: ['Browser / OS / Mobile', 'OS / click navigation'],
  INSIDEOUTs: ['WTL → STL / INSIDEOUT','Dictation / SGPU'],
  Constellation: ['Finder / Constellation'],
  Images: ['Logo'],
  Waterline: ['Waterline'],
}
const PATHS = {
  VS:'vs',SID:'SID',Technology:'technology',Greek:'greek',Phoenician:'phoenician',
  Other:'other',Finder:'vs/finder',Pages:'vs/pages',Dictation:'vs/dictation',
  Images:'vs/images',Waterline:'vs/waterline',SI:'SID/SI',SGPU:'SID/SGPU_CONTRACT.md',
  Relay:'SID/relay',Software:'technology/software',Interface:'technology/software/interface',
  'VS relay':'SID/relay/vs','MM relay':'SID/relay/mm','SGPU relay':'SID/relay/sgpu',
  'VS runtimes':'technology/software/interface/vs.json',
  Registry:'technology/software/registry.json',Dictionary:'technology/software/dictionary.md',
  S:'SID/SI/S',Photon:'phoenician/alef/tau/muon/axion/photon',
  Graviton:'phoenician/alef/tau/muon/axion/graviton',
  Transcripts:'other',History:'other',Logo:'vs/images/logo',
}
const APPS = ['Finder','Pages','Waterline','Notes','Agenda','Browser','ChatSMD']
const known = name => SOURCES.find(item => item.title === name)
const pathFor = name => PATHS[name] || null

function GitLink({name}) {
  const src = known(name)
  const path = pathFor(name)
  const url = src ? sourceLink(src) : path
    ? 'https://github.com/sideMD/side/' + (/\.(md|json|py)$/.test(path) ? 'blob/' : 'tree/') + 'main/' + path : null
  return url ? <a href={url} target="_blank" rel="noreferrer">Open verified source</a> : null
}

export default function FinderColumns({onOpenPages,onOpenWaterline,onReadSource,onReadRecord}) {
  const [path,setPath] = useState(['SIDE','VS'])
  const [selection,setSelection] = useState('Pages')
  const [query,setQuery] = useState('')
  const [showSources,setShowSources] = useState(true)
  const [folderFiles,setFolderFiles] = useState([])
  const [folderCount,setFolderCount] = useState(0)
  const [folderError,setFolderError] = useState('')
  const folderInput = useRef(null)
  const columns = useMemo(() => {
    const list = [['SIDE'],TREE.SIDE]
    for(const segment of path.slice(1)) {
      if (TREE[segment]) list.push(TREE[segment])
    }
    return list.slice(-4)
  },[path])
  const results = useMemo(() => {
    const q=query.trim().toLocaleLowerCase('pt-BR')
    if(!q) return SOURCES
    return SOURCES.filter(item => [item.title,item.origin,item.kind,...item.terms]
      .join(' ').toLocaleLowerCase('pt-BR').includes(q))
  },[query])
  const localResults = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('en')
    return folderFiles.filter(entry => !q || entry.path.toLocaleLowerCase('en').includes(q)).slice(0, 120)
  }, [folderFiles, query])
  function chooseFolder(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const accepted = files.filter(file => /(?:\.insideout|\.md|\.markdown|\.txt)$/i.test(file.name))
      .sort((a,b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name))
    setFolderFiles(accepted.slice(0, 3000).map(file => ({
      file, path: file.webkitRelativePath || file.name, name: file.name,
    })))
    setFolderCount(accepted.length)
    setFolderError('')
  }
  async function openLocalFile(entry) {
    if (entry.file.size > 2 * 1024 * 1024) {
      setFolderError('File exceeds the 2 MB reader limit.')
      return
    }
    try {
      const content = await entry.file.text()
      setFolderError('')
      onReadRecord?.({
        ref: 'local-file:' + entry.path, title: entry.name, kind: 'INSIDEOUT',
        original: false, detail: content, text: content,
        date: entry.file.lastModified ? new Date(entry.file.lastModified).toISOString() : '',
        precision: 'file modification time',
      })
    } catch {
      setFolderError('Unable to read this file.')
    }
  }
  function select(name) {
    setSelection(name)
    const parentIndex=path.indexOf(name)
    if(parentIndex>=0) return
    if(TREE[name]) {
      let parent=path.findLast?.(n=>TREE[n]?.includes(name)) || path[path.length-1]
      const i=path.indexOf(parent)
      setPath([...path.slice(0,i+1),name])
    }
  }
  function open(name) {
    const source = known(name)
    if (source) return onReadSource?.(source)
    if(name==='Pages'||name==='Dictation') return onOpenPages()
    if(name==='Waterline') return onOpenWaterline()
    select(name)
  }
  const detail=known(selection)
  return (
    <div className="finder-shell">
      <nav className="finder-stage" aria-label="Stage">
        <img src={sideSymbol} alt="SIDE" />
        {APPS.map((name,i)=><button type="button" key={name}
          disabled={!['Finder','Pages','Waterline'].includes(name)}
          aria-label={name} title={name}
          className={name==='Finder'?'on':''}
          onClick={()=>name==='Pages'?onOpenPages():name==='Waterline'?onOpenWaterline():setPath(['SIDE','VS'])}>
          <span>{['F','P','W','N','A','B','C'][i]}</span><small>{name}</small>
        </button>)}
      </nav>
      <main className="finder-center">
        <header className="finder-title"><div><small>VS / FILES</small><h1>Finder</h1><p>Universes, files and INSIDEOUTs by reference.</p></div>
          <div className="finder-title-actions">
            <button type="button" onClick={() => folderInput.current?.click()}>Open folder</button>
            <button type="button" onClick={onOpenPages}>Open Pages</button>
            <input type="file" hidden ref={folderInput} webkitdirectory="" directory="" multiple onChange={chooseFolder} />
          </div>
        </header>
        <div className="finder-search">
          <svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
          <input value={query} onChange={e=>{setQuery(e.target.value);setShowSources(true)}} placeholder="Search INSIDEOUTs and October concepts…" aria-label="Search INSIDEOUT references"/>
          <button type="button" onClick={()=>setShowSources(v=>!v)} aria-expanded={showSources}>Sources {showSources?'−':'+'}</button>
        </div>
        <section className="finder-columns" aria-label="Column Finder">
          {columns.map((items,index)=><div className="finder-column" key={index} aria-label={'Column '+(index+1)}>
            {items.map(name=><button type="button" key={name} onClick={()=>select(name)} onDoubleClick={()=>open(name)}
              className={'finder-cell'+(selection===name?' picked':'')+(path.includes(name)?' in-path':'')}>
              <span className="cell-symbol">{TREE[name]?'▣':'≡'}</span><span>{name}</span>{TREE[name]&&<span className="cell-next">›</span>}
            </button>)}
          </div>)}
        </section>
        {folderCount > 0 && <section className="finder-source-results finder-local-results" aria-label="Local INSIDEOUT files">
          <div className="finder-results-top"><strong>Local INSIDEOUTs</strong>
            <small>{folderCount} Markdown/text files in selected folder</small></div>
          <p className="finder-local-note">Choose a file to read it here. Local content stays on this device.</p>
          {folderError && <p role="alert">{folderError}</p>}
          {localResults.map(entry => <button type="button" key={entry.path} className="finder-source-row"
            onClick={() => openLocalFile(entry)} title="Read local INSIDEOUT">
            <span className="source-kind">LOCAL</span><span className="source-title">{entry.name}</span>
            <span className="source-origin">{entry.path}</span><span className="source-open">Read ↗</span>
          </button>)}
          {localResults.length === 0 && <p>No local files match your search.</p>}
          {folderCount > 3000 && <p>Showing the first 3,000 files. Narrow your folder to read more.</p>}
          {localResults.length === 120 && <p>Showing 120 matches. Refine the search to see more.</p>}
        </section>}
        {showSources&&<section className="finder-source-results" aria-label="Source results">
          <div className="finder-results-top"><strong>INSIDEOUTs / Sources</strong><small>{results.length} verified references</small></div>
          {results.map(item=><button type="button" key={item.id} className="finder-source-row"
            onClick={() => onReadSource?.(item)} title="Read INSIDEOUT here">
            <span className="source-kind">{item.kind}</span><span className="source-title">{item.title}</span>
            <span className="source-origin">{item.origin}</span><span className="source-open">Read ↗</span>
          </button>)}
          {results.length===0&&<p>No indexed source matches this search.</p>}
        </section>}
      </main>
      <aside className="finder-inspector" aria-label="Right-side selection panel">
        <div className="inspector-heading">ORDER <span>reference</span></div>
        <div className="inspector-kind">CURRENT SELECTION</div>
        <h2>{selection}</h2>
        <code>{detail?.path||pathFor(selection)||'SIDE'}</code>
        <p>{detail?.origin||"Initial address-based navigation. Order's behavior awaits the canonical source."}</p>
        <GitLink name={selection}/>
        <div className="inspector-bottom">Source references only; not a live filesystem or MM mirror.</div>
      </aside>
    </div>
  )
}
