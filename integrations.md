# Integrações LeadFlow Ops

## Workflow n8n existente

O painel envia as buscas para `N8N_WEBHOOK_URL` com `POST` e o corpo abaixo. O workflow deve usar `niche` em `searchStringsArray[0]`, `locationQuery` no ator do Apify e preservar `searchRunId` para rastreabilidade.

```json
{
  "searchRunId": 42,
  "niche": "dentista",
  "city": "São Paulo",
  "state": "SP",
  "region": "Vila Mariana",
  "locationQuery": "São Paulo, SP, Vila Mariana",
  "searchStringsArray": ["dentista"]
}
```

## Ingestão de leads

O n8n pode enviar cada lead para `POST /api/integrations/n8n/leads` com `Authorization: Bearer <N8N_WEBHOOK_TOKEN>`. O endpoint aceita tanto o lead diretamente no corpo quanto dentro de `{ "lead": { ... } }` e faz upsert pelo telefone normalizado.

Os nomes legados do workflow são aceitos: `nome`, `telefone`, `categoria`, `endereco`, `estrelas`, `avaliacoes`, `site`, `instagram`, `facebook` e `whatsapp_valido`. A API também aceita os nomes em inglês usados pelo painel.

## Validação WhatsApp

A validação atual permanece no fluxo n8n com Evolution Go. O n8n pode retornar `whatsapp_valido` e `whatsapp_jid` pelo mesmo endpoint de ingestão, sem necessidade de alterar o nó existente de validação. A regra operacional do painel considera válido somente o valor booleano `true`.

## Qualificação OpenRouter

A tela de qualificação chama o OpenRouter no servidor, usando `OPENROUTER_API_KEY`. O modelo configurado inicialmente é `openai/gpt-4o-mini` e deve responder JSON com `score`, `status` e `reason`. A aplicação limita score ao intervalo de 0 a 100 e marca o lead como pronto quando o status é `qualified` e o score é pelo menos 70.

## Exportação

A exportação gera CSV com leads de score mínimo 70 e WhatsApp válido. O arquivo contém `nome`, `telefone`, `categoria`, `cidade`, `estado`, `score`, `status`, `site` e `endereco`, pronto para o próximo fluxo de envio autorizado no Evolution Go.
