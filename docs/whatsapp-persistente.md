# WhatsApp persistente no SDEBR

## Escopo implementado

O SDEBR permite cadastrar múltiplas instâncias Evolution Go por usuário. Cada cadastro possui nome operacional, telefone, nome da instância, URL, chave criptografada, status de conexão, último heartbeat, último erro e identificador do job agendado. A interface de Conversas permite selecionar o remetente por conversa; o payload encaminhado ao n8n contém `numberId`, `phone`, `instanceName`, `apiUrl`, `apiKey` e `keepAlive` da instância escolhida.

O heartbeat consulta a rota `instance/connectionState/{instanceName}` da Evolution Go a cada cinco minutos quando ativado. Estados `open`, `connected` e `online` são registrados como `connected`; respostas HTTP não bem-sucedidas são registradas como `error`; os demais estados são registrados como `offline`. O callback é idempotente e usa o `taskUid` autenticado pelo agendador para localizar a instância, nunca dados enviados pelo corpo da requisição.

> O heartbeat monitora e atualiza o estado operacional. A reconexão efetiva da sessão WhatsApp continua sendo responsabilidade da Evolution Go ou do workflow n8n: o fluxo recomendado é tratar `connectionStatus = error/offline` no n8n, solicitar a reconexão da instância conforme a API Evolution Go instalada e registrar o novo estado no próximo heartbeat.

## Produção e Reserved Hosting

Para manter uma conexão WhatsApp disponível continuamente, o ambiente de produção precisa aceitar chamadas agendadas e manter o endpoint do SDEBR acessível. O modo Autoscale pode reduzir instâncias ociosas a zero; por isso, não se deve depender de `setInterval`, `node-cron` ou processos em memória para manter a sessão. O SDEBR usa Heartbeat gerenciado para que a verificação sobreviva à hibernação do sandbox.

Para operação 24/7, recomenda-se **Reserved Hosting**, pois ele mantém um processo de servidor sempre disponível e reduz a latência dos webhooks da Evolution Go e do n8n. Reserved Hosting não substitui a sessão persistente na Evolution Go: a instância, o webhook, a política de reconexão e o armazenamento de autenticação continuam precisando estar configurados no ambiente Evolution Go.

## Procedimento de ativação

Primeiro, publique o SDEBR e configure a URL pública de callback no ambiente de produção. Depois, cadastre a instância na aba Conversas, marque a conexão como ativa e clique em **Ativar heartbeat**. O job padrão usa a expressão UTC `0 */5 * * * *`. Em seguida, confirme no cartão da instância o status `Conectado`, o horário do último heartbeat e a ausência de erro.

Antes de disparos em escala, valide uma mensagem controlada pelo n8n. Em caso de falha, verifique a URL base da Evolution Go, o nome exato da instância, a chave, o endpoint de connection state, o webhook de eventos e os logs do n8n. Não grave chaves em texto puro nem compartilhe a URL do painel com terceiros.
