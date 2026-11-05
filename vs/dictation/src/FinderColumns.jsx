import { useMemo, useState } from 'react'
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

export default function FinderColumns({onOpenPages,onOpenWaterline}) {
  const [path,setPath] = useState(['SIDE','VS'])
  const [selection,setSelection] = useState('Pages')
  const [query,setQuery] = useState('')
  const [showSources,setShowSources] = useState(true)
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
    if(name==='Pages'||name==='Dictation') return onOpenPages()
    if(name==='Waterline'||name==='Waterline') return onOpenWaterline()
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
          <button type="button" onClick={onOpenPages}>Open document</button>
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
        {showSources&&<section className="finder-source-results" aria-label="Source results">
          <div className="finder-results-top"><strong>INSIDEOUTs / Sources</strong><small>{results.length} verified references</small></div>
          {results.map(item=><a key={item.id} href={sourceLink(item)} target="_blank" rel="noreferrer">
            <span className="source-kind">{item.kind}</span><span className="source-title">{item.title}</span>
            <span className="source-origin">{item.origin}</span><span className="source-open">↗</span>
          </a>)}
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
