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

- [x] Criar modelo persistente de conversas, mensagens, status kanban e ordem de atendimento
- [x] Adicionar endpoint/webhook para receber mensagens do n8n/Evolution Go e salvar histórico
- [x] Criar página Conversas na navbar com kanban de atendimento
- [x] Exibir mensagens da IA e permitir resposta manual pelo painel
- [x] Permitir arrastar leads entre colunas e iniciar atendimento por ordem
- [x] Criar fluxo de resgate para leads desinteressados, com fila e ação de reativação
- [x] Integrar envio manual e atualização de status ao n8n/Evolution Go usando credenciais do painel
- [x] Adicionar testes Vitest para mensagens, mudança de estágio, ordem e resgate
- [x] Validar a central Conversas em desktop e mobile
- [x] Implementar ordenação real da fila de atendimento com persistência e reordenação entre leads em atendimento
- [x] Criar ação explícita de reativação para leads na fila de resgate, com estágio e mensagem de retorno
- [x] Integrar eventos MESSAGES_UPDATE e SEND_MESSAGE_UPDATE da Evolution e usar credenciais salvas para o fluxo de conversas
- [x] Adicionar testes Vitest para persistência de mensagens, mudança de estágio, ordenação e reativação com mocks
- [x] Criar testes Vitest mockados para conversations.move, conversations.reorder e conversations.reactivate
- [x] Criar teste mockado de MESSAGES_UPDATE/SEND_MESSAGE_UPDATE atualizando mensagem por externalId
- [x] Criar teste Vitest direto de ingestEvolutionMessage para MESSAGES_UPDATE e SEND_MESSAGE_UPDATE com update por externalId
- [x] Criar teste direto de ingestEvolutionMessage para MESSAGES_UPDATE e SEND_MESSAGE_UPDATE usando updater mockado

- [x] Criar tabela persistente de números/instâncias WhatsApp por usuário
- [x] Permitir cadastrar múltiplos números com nome, telefone, instância, URL e chave Evolution Go
- [x] Permitir editar, remover, ativar/desativar e definir número padrão
- [x] Permitir selecionar o número de saída por conversa e encaminhá-lo ao n8n/Evolution
- [x] Exibir o gerenciador de números dentro da aba Conversas
- [x] Adicionar testes Vitest para cadastro, edição, remoção, número padrão e dispatch selecionado
- [x] Validar o gerenciador de WhatsApp em desktop e mobile

- [x] Adicionar modo de conexão persistente para o número de disparos automáticos
- [x] Implementar heartbeat/reconexão e status operacional da instância Evolution Go
- [x] Garantir que o dispatch automático use o número/instância selecionado e credenciais próprias
- [x] Documentar a necessidade de processo sempre ativo e a opção Reserved para produção
- [x] Adicionar testes Vitest para seleção do número, reconexão e payload de disparo
- [x] Validar a tela e os estados de conexão em desktop e mobile

- [x] Criar testes Vitest reais para CRUD de números, padrão e dispatch com whatsappNumberId
- [x] Corrigir validação do cron para aceitar intervalos como */5 e testar ativação/desativação
- [x] Alinhar escopo do heartbeat como monitoramento e registrar estratégia de reconexão via Evolution Go/n8n
- [x] Criar documentação dedicada sobre Reserved Hosting e processo sempre ativo
- [x] Executar validação visual específica do gerenciador e estados de conexão em desktop e mobile

- [x] Refinar o card de cadastro de números WhatsApp com melhor hierarquia visual, estados e responsividade

- [x] Adicionar confirmação e estado visual para remover números WhatsApp cadastrados

- [x] Adicionar limite de leads e CEP no card de nova coleta, encaminhando os filtros ao n8n/Apify
- [x] Refinar o design do card de nova coleta e validar responsividade em desktop, tablet e mobile

- [x] Criar cadastro persistente de modelos de mensagem por usuário, com nome, categoria, texto, variáveis e status ativo
- [x] Permitir reutilizar modelos no envio manual e encaminhar o conteúdo ao n8n/Evolution Go
- [x] Adicionar testes e validação responsiva da gestão de modelos

- [x] Adicionar geração de modelos de mensagem por IA a partir da descrição do produto/serviço
- [x] Permitir revisar o texto gerado e transferi-lo para o formulário de modelo antes de salvar
- [x] Testar a procedure de IA e validar a interface em desktop e mobile

- [x] Remover a barra lateral visual e aplicar rolagem suave sem bloquear o scroll em desktop e mobile

- [x] Corrigir “Exportar melhores” com filtros de score e WhatsApp, CSV profissional e estados de sucesso/erro
- [x] Validar a exportação em desktop e mobile e cobrir o contrato com testes

- [x] Refinar navegação lateral do SDEBR com marca, estados ativos, espaçamento e responsividade mais profissionais

- [x] Refinar o card de geração de modelos por IA com melhor contraste, hierarquia visual e responsividade

- [x] Criar Dockerfile de produção para build completo do frontend e servidor SDEBR
- [x] Documentar variáveis de ambiente, execução com PORT e publicação da imagem em um registry
- [x] Validar o build local e o contrato Docker; execução real do container depende de ambiente com Docker
