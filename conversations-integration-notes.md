# Central de Conversas — notas de integração

A documentação pública da Evolution API confirma suporte a webhooks em tempo real via HTTP POST, com configuração global ou por instância, headers customizados, filtragem de eventos e retry. Para a central SDEBR, os eventos principais são `MESSAGES_UPSERT` para mensagens recebidas/enviadas, `MESSAGES_UPDATE` para status de entrega/leitura e `CONNECTION_UPDATE` para estado da instância. O payload inclui `event`, `instance`, `data.key.remoteJid`, `data.key.fromMe`, `data.key.id`, `data.pushName`, `data.message.conversation`, `messageType` e timestamp.

Arquitetura adotada: o endpoint do SDEBR recebe o webhook, normaliza a mensagem, associa o telefone ao lead e persiste conversa/mensagem; o painel lê o histórico e envia respostas pelo n8n/Evolution Go sem expor credenciais. A UI também suporta arrastar cartões entre estágios e mantém uma fila de resgate para leads com interesse `not_interested`.

Fonte consultada: https://evolutionapi-evolution-api-90.mintlify.app/concepts/webhooks
