# Executar o SDEBR por imagem Docker

O projeto agora possui um `Dockerfile` na raiz. A imagem executa o build completo do frontend e do servidor, e inicia o Express com `node dist/index.js`. O processo usa a porta definida por `PORT`; no exemplo local, ela é publicada como `3000:3000`.

## Build local

Na raiz do projeto, execute:

```bash
docker build \
  --build-arg VITE_APP_TITLE=SDEBR \
  -t ghcr.io/SEU_USUARIO/sdebr:latest .
```

Os argumentos `VITE_*` são valores públicos do frontend e podem ser definidos durante o build. **Não coloque `DATABASE_URL`, `JWT_SECRET`, chaves da Evolution Go, OpenRouter, n8n ou outros segredos em argumentos de build**, pois eles podem ficar registrados nas camadas da imagem.

## Publicar a imagem e obter o link

Depois de autenticar no registry escolhido, publique a imagem:

```bash
docker login ghcr.io
docker push ghcr.io/SEU_USUARIO/sdebr:latest
```

O link da imagem será:

```text
ghcr.io/SEU_USUARIO/sdebr:latest
```

Também é possível usar Docker Hub, substituindo o prefixo por `docker.io/SEU_USUARIO/sdebr:latest`.

## Executar usando o link da imagem

No servidor de destino, configure as variáveis secretas no ambiente ou em um arquivo `.env` que **não seja commitado**:

```bash
docker run -d \
  --name sdebr \
  --restart unless-stopped \
  --env-file .env \
  -e PORT=3000 \
  -p 3000:3000 \
  ghcr.io/SEU_USUARIO/sdebr:latest
```

A aplicação ficará disponível na porta `3000` do servidor. Para uso público, coloque um proxy HTTPS ou um balanceador de carga na frente do container e aponte o domínio para o servidor.

## Variáveis essenciais

A instalação externa precisa fornecer pelo menos o banco, a sessão e os serviços usados pelo backend. Os nomes exatos devem ser preenchidos conforme o ambiente do usuário e nunca devem ser gravados no Git.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão com MySQL/TiDB usada pelo Drizzle |
| `JWT_SECRET` | Assinatura da sessão |
| `OAUTH_SERVER_URL` | Serviço OAuth |
| `VITE_OAUTH_PORTAL_URL` | URL pública do portal OAuth; se omitida, usa `OAUTH_PORTAL_URL` ou `OAUTH_SERVER_URL` como fallback |
| `VITE_APP_ID` | Identificador público do aplicativo OAuth |
| `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY` | Serviços internos usados pelo backend |
| `OPENROUTER_API_KEY` | Qualificação e geração de mensagens por IA, se usado externamente |
| `N8N_WEBHOOK_URL` e `N8N_WEBHOOK_TOKEN` | Integração com os workflows n8n |
| `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` | Compatibilidade global com Evolution Go |

O login OAuth usa a rota server-side `/api/oauth/start`, que monta o callback com o domínio público atual. Por isso, no EasyPanel, `VITE_APP_ID` e `OAUTH_SERVER_URL` precisam existir como variáveis de runtime do container; não é necessário depender desses valores no bundle do frontend. O domínio público precisa estar cadastrado como redirect URI permitido no aplicativo OAuth. As chaves específicas de Apify, n8n, OpenRouter, Evolution Go, Postgres e Hasura também podem continuar sendo cadastradas no painel do SDEBR; elas são criptografadas e armazenadas pelo servidor.

## Observações operacionais

A imagem é adequada para um serviço Node persistente, mas a conexão contínua com Evolution Go e os heartbeats dependem de o servidor permanecer ativo. Em uma plataforma com autoscaling, prefira uma modalidade sempre ativa ou um serviço reservado. O Dockerfile não cria banco de dados nem substitui a configuração de DNS, TLS, firewall ou secrets do provedor.
