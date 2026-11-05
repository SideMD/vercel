# VS.site.md — pedido direto da linha mãe side.md

IN — A mãe publicou o MCP v0.5.0 no repositório `sideMD/side`.
HEAD de entrega: `edf9b42258f8a7a184709245f381a422f5a426de`.
Handoff e backlog canônicos:
- `sideMD/side/SDM/coordination/MCP-v0.5.0-HANDOFF.md`
- `sideMD/side/SDM/coordination/MML.json` (MML-19, MML-20, MML-21, MML-22)
- `sideMD/side/parallel/README.md`
- `sideMD/side/other/2026/10/weeks/3/15/` e `other/2026/11/`

AT — Qual MCP usar?

O MCP mãe que responde `md.status.server=side.md` e
`md.capabilities({}).version=0.5.0` oferece:
`md.parallel.status`, `md.parallel.append`,
`md.parallel.timeline`, `md.parallel.get`,
`md.insideout.status`, `md.insideout.put`,
`md.insideout.timeline`, `md.insideout.get`,
`md.mml.list`, `md.read`, `md.list`.
O núcleo SGPU é outro processo `side.py` e seu `sgpu.*`.
Nem nome do plugin nem código no Git bastam para afirmar que a conexão
da conversa está atualizada. Se `md.capabilities` não aparecer,
reportar `MCP_CATALOG_STALE` e seguir com o fallback Git.

AT — O que VS pode fazer agora?

1. Consultar `md.capabilities` e verificar `version=0.5.0`.
2. Ler `md.parallel.timeline({recipient:"VS"})` e
   `md.insideout.timeline({recipient:"VS"})` no MM pessoal quando
   configurado, sem confundir vazio com desconectado.
3. Implementar a **primeira lista real**: posição semântica, autor,
   papel, WTL de origem, índice, status, destinatário e ID de mensagem.
   Ao abrir um item, `md.parallel.get({id})` devolve texto e SHA;
   `md.insideout.get({id})` devolve o INSIDEOUT integral.
4. Registrar mensagem de usuário e resposta do assistente por
   `md.parallel.append` somente quando a origem entrega mensagem,
   ID e WTL reais. Não simular que ChatGPT entrega automaticamente
   todos os turnos ao plugin.
5. Depois de cada ação visual concluída, gerar um novo evento
   ou INSIDEOUT com `recipient=side.md` ou `recipient=side`,
   `next_action` e referências. Não bloquear Stop/Undo.
6. Consumir `HANDOFF` de capacidade da mãe e `OUT.sha256`
   do núcleo sem colocar URL/credenciais do MM em browser, Vite,
   código público ou analytics.

OUT — O que precisamos que a VS informe sem perguntar ao usuário

- Quais telas de Finder/WTL/Pages/Dictation/INSIDEOUT já funcionam
  **de verdade**, com referência a commit e teste.
- Qual a próxima microfunção ausente, quem pode suprir
  (`recipient=side.md` para suporte/proxy,
  `recipient=side` para SGPU), entrada/saída esperadas.
- Se executou `md.parallel.timeline/get` e `md.insideout.timeline/get`,
  com estado da conexão e IDs lidos.
- Se a primeira lista apareceu no site ou no app e se foi testada
  no navegador/macOS real, distinguindo CI.
- Registro da própria linha VS em MM com readback, ou fallback
  no Git em `vs/MCP-v0.5.0-RECEIVE.md`. O fallback não é
  confirmação de persistência MM.

A mãe não declara ACK da VS apenas por publicar este documento.
