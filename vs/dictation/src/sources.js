/** Indexed references verified in the repository. Old renamed paths are pinned to their source commit. */
export const SOURCES = [
  {
    "id": "browser-os",
    "title": "Browser / OS / Mobile",
    "kind": "INSIDEOUT",
    "date": "2026-10-31",
    "origin": "October · operating modes",
    "path": "greek/alpha/nervous/brain/neural/connectomme/SMD/sky/brain/frontal/2026/10/31/20/browser-os-mobile-modes-local-run-and-1515-provenance.insideout",
    "sha": "82246e51e",
    "terms": [
      "navigation",
      "desktop",
      "browser",
      "mobile",
      "RUN"
    ]
  },
  {
    "id": "finder-address",
    "title": "Finder / Constellation",
    "kind": "SOURCE",
    "date": "2026-10",
    "origin": "Addressing / idea",
    "path": "greek/alpha/neurons/neural/brain/nervous/mind/eidos/constellation/GMD-IDEA-ADDRESSING.md",
    "sha": "8a44f95cf",
    "terms": [
      "finder",
      "reentry",
      "idea",
      "gmd",
      "universes"
    ]
  },
  {
    "id": "wtl-jump",
    "title": "WTL → STL / INSIDEOUT",
    "kind": "INSIDEOUT",
    "date": "2026-11-02",
    "origin": "Waterline / jumps",
    "path": "greek/alpha/nervous/brain/neural/connectomme/forest/hippocampus/2026/11/02/21/30/34/01--wtl-jump-stl-insideout-navegacao.insideout.md",
    "sha": "5878e56a0",
    "terms": [
      "waterline",
      "messages",
      "wtl",
      "stl",
      "insideout"
    ]
  },
  {
    "id": "os-graph",
    "title": "OS / click navigation",
    "kind": "SOURCE",
    "date": "2026-10",
    "origin": "Human interface",
    "path": "graph.md.prompt",
    "sha": "26e75dd16",
    "terms": [
      "os",
      "finder",
      "editor",
      "save",
      "new event",
      "recent",
      "ebook"
    ]
  },
  {
    "id": "vs-sgpu",
    "title": "Dictation / SGPU",
    "kind": "INSIDEOUT",
    "date": "2026-11-05",
    "origin": "VS / SGPU contract",
    "path": "SID/relay/vs/2026-11-05-dictation-sgpu.insideout.md",
    "sha": "e646ae4",
    "terms": [
      "sgpu",
      "dictation",
      "stop",
      "transcribe",
      "receipt"
    ]
  },
  {
    "id": "sgpu-contract",
    "title": "SGPU / contract",
    "kind": "SOURCE",
    "date": "2026-11-05",
    "origin": "Processing",
    "path": "SID/SGPU_CONTRACT.md",
    "sha": "e646ae4",
    "terms": [
      "sgpu",
      "wtl",
      "out",
      "sha",
      "mm"
    ]
  }
]
export function sourceLink(item) {
  const isFile = /\.[a-z0-9]+$/i.test(item.path)
  return 'https://github.com/sideMD/side/' + (isFile ? 'blob' : 'blob') + '/' + item.sha + '/' + item.path.split('/').map(encodeURIComponent).join('/')
}
