# Project TODO

- [x] Criar formulário de configuração de busca com cidade, estado, região e nicho
- [x] Integrar configuração de busca ao disparo de coletas no Apify via fluxo compatível com n8n
- [x] Modelar persistência de buscas, leads, validações, qualificações e eventos de integração
- [x] Criar endpoint protegido para receber leads enviados pelo n8n e salvar/atualizar leads com idempotência
- [x] Criar listagem de leads com dados completos e status de WhatsApp válido, inválido ou pendente
- [x] Implementar filtros por localidade, nicho, status de WhatsApp e score de qualificação
- [x] Implementar validação e atualização do status de WhatsApp através do Evolution Go/n8n
- [x] Criar tela de tratamento e qualificação com integração ao OpenRouter
- [x] Definir score, classificação e justificativa de qualificação dos leads
- [x] Criar dashboard com total coletado, taxa de WhatsApp válido, qualificados e prontos para envio
- [x] Implementar exportação CSV dos melhores leads para uso no Evolution Go
- [x] Avaliar My workflow.json e preservar compatibilidade com endpoints e estrutura de dados existentes
- [x] Criar testes Vitest de autenticação e credenciais; testes end-to-end com n8n real permanecem pendentes
- [x] Verificar responsividade, estados de carregamento, estados vazios, erros e acessibilidade
- [x] Validar a interface visualmente no navegador e corrigir problemas encontrados

- [x] Corrigir ingestão n8n para aceitar payload legado com telefone e cobrir idempotência com teste Vitest
- [x] Remover métricas e leads hardcoded e implementar estados reais de loading, vazio e erro
- [x] Criar rotas/páginas reais para Leads e Qualificação, ou alinhar a navegação ao que existe
- [x] Implementar filtro de score e região na UI e testar a filtragem
- [x] Modelar tabelas/histórico para validações, qualificações e eventos de integração
- [ ] Validar no ambiente n8n a ligação do webhook ao nó Apify e executar um teste real de coleta com os filtros dinâmicos

- [x] Adicionar teste Vitest para ingestão idempotente com payload legado usando telefone
- [x] Implementar estados visuais explícitos de loading, vazio e erro na Home
- [x] Adicionar testes Vitest para filtros de score e região
- [x] Criar teste Vitest de contrato do fluxo de ingestão n8n cobrindo payload legado com telefone e chave idempotente
