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

- [x] Revisar e reforçar o fluxo de login e logout pós-login
- [x] Criar navbar/sidebar pós-login com Visão geral, Leads, Qualificação, Configurações e Perfil
- [x] Criar página de perfil do usuário
- [x] Criar página de configurações de APIs com status e campos seguros para chaves
- [x] Permitir configuração segura das credenciais Apify, n8n, OpenRouter, Evolution Go, Postgres e Hasura
- [x] Persistir e atualizar preferências de perfil sem expor segredos no frontend
- [x] Criar testes Vitest para autenticação e validação das configurações de APIs
- [x] Validar visualmente o fluxo pós-login em desktop e mobile
- [x] Criar formulário interno para o usuário preencher credenciais de APIs diretamente no sistema
- [x] Salvar credenciais no servidor com valores mascarados e sem retorno do segredo ao frontend
- [x] Adicionar teste para atualização e mascaramento das configurações internas
- [x] Conectar as credenciais salvas pelo usuário ao uso real do n8n e OpenRouter
- [x] Implementar preferências editáveis de perfil com persistência server-side
- [x] Validar visualmente Configurações e Perfil em mobile
- [x] Adicionar teste de criptografia e mascaramento das configurações internas
- [x] Cobrir o fluxo existente de autenticação e logout com teste Vitest
- [x] Adicionar preferências reais de perfil além de nome e e-mail, com refetch após salvar
- [x] Criar teste Vitest do fluxo de criptografia e mascaramento das integrações
- [x] Cobrir o gate de acesso usando o componente autenticado e o teste de logout protegido
- [x] Criar teste Vitest para save/get de integrações com retorno mascarado ao frontend
- [x] Criar teste Vitest do gate de autenticação para acesso sem usuário
- [x] Criar teste mockado da procedure settings.saveIntegrations e settings.integrations cobrindo persistência, atualização e máscara
- [x] Adicionar cenário de segunda gravação e leitura mascarada no teste da router de configurações

- [x] Criar dashboard dedicado à qualidade dos leads com score, faixas, qualificação, WhatsApp e prontidão
- [x] Adicionar navegação para o dashboard de qualidade
- [x] Permitir editar/substituir cada credencial de API individualmente
- [x] Permitir remover cada credencial de API individualmente com confirmação
- [x] Cobrir dashboard e remoção individual de credenciais com testes
- [x] Validar dashboard e configurações em desktop e mobile

- [x] Adicionar campo persistente de foto/avatar no perfil do usuário
- [x] Implementar upload seguro de foto com validação de tipo e tamanho
- [x] Exibir avatar no perfil, navbar e estados de usuário autenticado
- [x] Analisar altixdev.com.br e documentar a direção visual aplicada ao LeadFlow Ops
- [x] Ajustar identidade visual global do painel com base na referência aprovada
- [x] Adicionar testes para upload/atualização do avatar e segurança do arquivo
- [x] Validar Perfil, navbar e dashboard em desktop e mobile
- [x] Aplicar a identidade visual Altixdev-inspired de forma consistente nas páginas principais, reduzindo cores hardcoded antigas
- [x] Criar teste Vitest de upload bem-sucedido com storage mockado e retorno de avatarUrl
- [x] Aplicar a identidade visual Altixdev-inspired também em Leads e remover hex verdes legados das telas principais
- [x] Testar saveUserAvatar real com storagePut e update do banco mockados, validando avatarUrl persistido
- [x] Concluir padronização visual das páginas principais usando tokens compartilhados
- [x] Executar grep final e remover hex colors legados remanescentes das páginas principais

- [x] Atualizar o título e os metadados da aplicação para SDEBR
- [x] Renomear a assinatura da navbar, textos do painel e Perfil para SDEBR
- [x] Validar a nova marca em desktop e mobile e executar os testes
- [x] Completar metadados da aplicação para SDEBR, incluindo descrição e Open Graph quando aplicável
- [x] Validar visualmente a marca SDEBR também em desktop após a renomeação
