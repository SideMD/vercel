# Handoff de side.md para VS.site.md — parallel sides

Origem: mãe `side.md`. Ref técnica:
`sideMD/side@9e055a4a50f64fff4a71abb35a057a8f9bc7e4fc`.
INSIDEOUT completo:
`sideMD/side/SDM/coordination/parallel-message-ledger.insideout.md`.
Semântica fonte: `sideMD/side/parallel/README.md`.

## Contrato de leitura
O processo confiável da aplicação deve chamar o MCP `side.md.py`,
que oferece `md.parallel.status`, `md.parallel.timeline`,
`md.parallel.get`, `md.parallel.append`.

A lista na UI deve mostrar por mensagem:
`line` (`side.md`, `side`, `VS`),
`parallel_side_id`, `semantic_label`, `speaker`,
`role`, `wtl`, `turn_index`, `kind`, `stage`,
`status` e `recipient`. O usuário abre o conteúdo integral
sob demanda por `md.parallel.get({id})`. Um clique deve permitir
seguir `in_reply_to` até a mensagem anterior, sem inventar
posição temporal ou alterar o original.

## Contrato de gravação
Apenas backend autorizado chama `md.parallel.append` com
`line`, `parallel_side_id`, `semantic_label`, `message_id`,
`turn_index`, `speaker`, `role`, `wtl`, `source_ref`,
`text`. O cliente que realmente recebeu a mensagem deve
fornecer ID estável, índice e hora real com fuso (ou a data
sem segundo quando não há segundo). Enviar cada mensagem de
usuário E cada resposta do assistente, após serem observadas.

A ferramenta não captura nativamente todos os chats ChatGPT:
sem ponte do cliente para o MCP, não há mensagem a gravar.
Não incluir `SIDE_MM_URL` nem credenciais no bundle
público Vite/Vercel. Preservar Stop/Undo e edição offline
caso a MM esteja indisponível.

## Sequência para VS
1. Descobrir a versão MCP 0.5.0 atualizada e o MM configurado.
2. Ler a timeline `md.parallel.timeline({line:"VS"})` e
   `md.parallel.timeline({recipient:"VS"})` e conferir IDs.
3. Mostrar lista real: quem, qual parallel side, quando,
   resumo/status, referência e leitura do texto.
4. Instrumentar entrada e saída do chat/VS para gravar
   mensagens com `md.parallel.append`, com autenticação.
5. Exibir `HANDOFF` e `CAPABILITY` com evidência; não
   assumir que processamento SGPU, Cosmos ou GPU externa
   ocorreu por causa do rótulo da etapa.
6. Publicar seu próprio INSIDEOUT após implementar/testar,
   mantendo `source_ref` e o resultado do readback.

CI da mãe no momento do handoff:
- teste MCP/local: `42075605680`
- MM Redis isolado: `42075432324`

Recebimento/ACK pela VS, autenticação em produção e
captura automática dos chats estão **pendentes**.
