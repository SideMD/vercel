import './workspaces.css'

const MASKS = {
  ws: {
    name: 'WS', caption: 'Conversation / INSIDEOUT origin',
    description: 'A workspace for human and AI lines, with a preserved source and an editable INSIDEOUT view.',
    source: 'SID/relay/vs', sections: ['Conversations', 'Whole Messages', 'INSIDEOUT capture'],
  },
  agenda: {
    name: 'Agenda', caption: 'Time / WTL',
    description: 'A temporal view for events, commitments and links between factual WTL and semantic Sides.',
    source: 'TM', sections: ['WTL calendar', 'ATL projections', 'Upcoming events'],
  },
  browser: {
    name: 'Browser', caption: 'Source / research',
    description: 'An authorized browsing surface that keeps the original reference attached to each result.',
    source: 'other', sections: ['Source addresses', 'Research sessions', 'Saved references'],
  },
  chatsmd: {
    name: 'ChatSMD', caption: 'Messages / provenance',
    description: 'Messages with source attribution and clear transitions into INSIDEOUTs and Sides.',
    source: 'SDM', sections: ['Whole Messages', 'Source spans', 'Shared lines'],
  },
  wisewiki: {
    name: 'WiseWiki', caption: 'Knowledge / connections',
    description: 'A source-linked document view with INSIDEOUT references, semantic links and reading routes.',
    source: 'greek', sections: ['Pages', 'Connections', 'Source graph'],
  },
  twin: {
    name: 'Twin', caption: 'Paired environments',
    description: 'A future interface for paired environments and SIDE execution scopes.',
    source: 'technology', sections: ['Environments', 'Side references', 'Events'],
  },
  taurus: {
    name: 'Taurus', caption: 'Historical design',
    description: 'A retained design contact for historical flows, to be reconciled with current SIDE contracts.',
    source: 'other', sections: ['Archive', 'Interaction model', 'Migration'],
  },
  paris: {
    name: 'Paris', caption: 'Legacy editing',
    description: 'Earlier visual editing concepts, adapted into Finder and Pages when proven useful.',
    source: 'vs', sections: ['Bars', 'Panels', 'Editing'],
  },
}

export const MASK_NAMES = Object.keys(MASKS)

export default function WorkspaceSurface({surface, onOpenFinder, onOpenPages, onOpenWaterline}) {
  const mask = MASKS[surface] || MASKS.ws
  return (
    <main className="vs-mask" aria-label={mask.name + ' interface'}>
      <aside className="vs-mask-index">
        <div className="vs-mask-label">SIDE / APPLICATIONS</div>
        <h1>{mask.name}</h1>
        <p>{mask.caption}</p>
        <div className="vs-mask-rail">
          {mask.sections.map((name,index)=><div key={name} className={index===0?'is-main':''}>
            <span>{String(index+1).padStart(2,'0')}</span>{name}</div>)}
        </div>
      </aside>
      <section className="vs-mask-center">
        <div className="vs-mask-kicker">INTERFACE MASK · {mask.name.toUpperCase()}</div>
        <h2>{mask.caption}</h2>
        <p>{mask.description}</p>
        <div className="vs-mask-grid">
          {mask.sections.map((name,index)=><article key={name}>
            <span className="vs-mask-number">0{index+1}</span>
            <h3>{name}</h3>
            <div className="vs-mask-frame" aria-hidden="true">
              <div/><div/><div/>
            </div>
            <small>Source-aware component to be connected</small>
          </article>)}
        </div>
      </section>
      <aside className="vs-mask-order">
        <div className="vs-mask-label">NEXT ACTIONS</div>
        <h2>Open working interfaces</h2>
        <button type="button" onClick={onOpenPages}>Pages / Edit</button>
        <button type="button" onClick={onOpenWaterline}>WTL / Sides</button>
        <button type="button" onClick={onOpenFinder}>Finder / Sources</button>
        <p>Interface mask preserved for iteration. The active editor, source reader and temporal navigation stay accessible.</p>
      </aside>
    </main>
  )
}
