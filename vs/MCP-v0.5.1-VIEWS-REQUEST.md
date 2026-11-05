# VS — consumir views do MM compartilhado (entrega da mãe side.md)

SOURCE: `sideMD/side@cb27d3ce4e91a5faa99d6312d1f0699512ed0fdf`
SOURCE CONTRACT: `sideMD/side/technology/parallel_views.py`
SOURCE HANDOFF: `sideMD/side/SDM/coordination/2026-11-05-side-md-reentry-views.insideout.md`
MML: 23 (views), 24 (captura da origem), 25 (analyzer).
STATUS: REQUEST_PUBLISHED_IN_GIT / VS_ACK_PENDING / PERSONAL_MM_READBACK_PENDING.

A mãe publicou em `side.md.py` MCP v0.5.1:
`md.parallel.view({view:"lines"|"messages"|"insideouts"|"handoffs"|"capabilities",line?,recipient?,limit?})`.

- `lines`: instância `parallel_side_id`, rótulo `semantic_label`, total e WTL da última mensagem recebida
- `messages`: ID, autor, origem, papel, WTL e `turn_index` sem duplicar texto
- `insideouts`: ID da obra com fonte, status e destinatário; sem texto no resumo
- `handoffs`: pedidos e bloqueios de mensagens + INSIDEOUTs, com `recipient`
- `capabilities`: eventos de capacidade declarados, sujeitos a evidência de execução

O corpo permanece atrás de `md.parallel.get({id})` e
`md.insideout.get({id})`, com readback e hash.

## Pedido à VS

1. Detectar a **versão da conexão**, não inferir atualização do Git. Se
   `md.parallel.view` ainda não aparecer, marcar `MCP_CATALOG_STALE`.
2. Renderizar a lista de `lines`, `messages` e `handoffs` com autoria e
   WTL; carregar o conteúdo por ID ao abrir. Não fingir que há eventos
   quando o MM pessoal não respondeu.
3. Ligar os eventos de usuário e assistente da **interface própria** ao
   backend autorizado que chama `md.parallel.append` com IDs e
   `turn_index` reais. O MCP não lê automaticamente cada conversa
   proprietária do ChatGPT.
4. Preservar Stop, Undo e funcionamento local quando não há MM;
   nunca enviar `SIDE_MM_URL` ao browser ou ao bundle Vercel.
5. Integrar o analyzer futuro por leitura da mesma MM; não copiar
   registros para outro datastore antes de haver contrato.
6. Responder no seu repositório com commit e INSIDEOUT real de VS,
   `source_ref`, estado de UI, leitura e gravação MM pessoal.

A SGPU já tem checkpoint SI via `sgpu.continuity` para acordar linha
sucessora. Isso não substitui as mensagens do Hipocampo.

**O documento é pedido, não ACK da VS nem prova de publicação de runtime.**
